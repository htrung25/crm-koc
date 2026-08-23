import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import {
  EKycDocumentType,
  EKycRejectReason,
  EKycStatus,
} from '../../common/enum/kyc.enum';
import { ERole } from '../../common/enum/roles.enum';
import { PaginatedResult, paginate } from '../../common/util/pagination.util';
import {
  StorageService,
  StorageStreamResult,
} from '../../common/services/storage.service';
import { StorageLedgerService } from '../../common/services/storage-ledger.service';
import { AuthEntity } from '../auth/entities/auth.entity';
import { EmailQueueService } from '../../queue/email/email-queue.service';
import { StorageQueueService } from '../../queue/storage/storage-queue.service';
import {
  ALLOWED_DOCUMENTS_BY_ROLE,
  ALL_KYC_STATUSES,
  KYC_STATUS_LABEL,
  KYC_TRANSITION_ACTORS,
  MAX_KYC_ATTEMPTS,
  OPEN_KYC_STATUSES,
  REQUIRED_DOCUMENTS,
  RESUBMIT_FROM_STATUSES,
} from './constants/kyc.constants';
import {
  STORAGE_PREFIX_PENDING,
  STORAGE_PREFIX_VERIFIED,
} from './constants/kyc-storage.constants';
import {
  KYC_LIST_FIELDS,
  KycListItem,
  KycRole,
} from './constants/kyc.constants';
import { KycDocument } from './entities/kyc-document.entity';
import { KycDocumentView } from './entities/kyc-document-view.entity';
import { KycSubmission } from './entities/kyc-submission.entity';
import { KycFilterDto, ReviewKycDto } from './dto/kyc.dto';
import { inspectDocument } from './util/kyc-document.util';

export interface DocumentStreamPayload {
  document: KycDocument;
  streamResult: StorageStreamResult;
}

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private readonly maxFileSize: number;
  private readonly validityDays: number;

  constructor(
    @InjectRepository(KycSubmission)
    private readonly submissionRepository: Repository<KycSubmission>,
    @InjectRepository(KycDocument)
    private readonly documentRepository: Repository<KycDocument>,
    @InjectRepository(KycDocumentView)
    private readonly viewRepository: Repository<KycDocumentView>,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly dataSource: DataSource,
    private readonly storage: StorageService,
    private readonly ledger: StorageLedgerService,
    private readonly emailQueue: EmailQueueService,
    private readonly storageQueue: StorageQueueService,
    configService: ConfigService,
  ) {
    // .env luôn trả chuỗi nên phải Number()
    this.maxFileSize = Number(
      configService.get('KYC_MAX_FILE_SIZE_BYTES', 10_485_760),
    );
    this.validityDays = Number(configService.get('KYC_VALIDITY_DAYS', 365));
  }

  // ---------------------------------------------------------------- Customer

  async openSubmission(
    accountId: string,
    role: KycRole,
  ): Promise<KycSubmission> {
    const latest = await this.findLatest(accountId, role);

    if (latest && OPEN_KYC_STATUSES.includes(latest.status)) {
      return latest;
    }

    // LOCKED (6) hoặc REJECTED khi đã hết 3 lượt: chặn trước khi vi phạm DB check constraint
    if (
      latest?.status === EKycStatus.LOCKED ||
      (latest?.status === EKycStatus.REJECTED &&
        latest.attemptNo >= MAX_KYC_ATTEMPTS)
    ) {
      throw new ForbiddenException({
        businessCode: EBusinessCode.KYC_ATTEMPTS_EXHAUSTED,
        message: 'kyc attempts exhausted, contact support',
      });
    }

    if (latest?.status === EKycStatus.VERIFIED) {
      throw new ConflictException('kyc is already verified for this role');
    }

    const attemptNo = this.nextAttemptNo(latest);
    const created = await this.submissionRepository.save(
      this.submissionRepository.create({
        accountId,
        role,
        status: EKycStatus.DRAFT,
        attemptNo,
      }),
    );

    // Nộp lại thì kế thừa tài liệu của attempt trước; người dùng chỉ phải tải
    // lại thứ dính lý do từ chối.
    if (latest && RESUBMIT_FROM_STATUSES.includes(latest.status)) {
      await this.carryOverDocuments(latest.id, created.id);
    }

    return created;
  }

  /** Tải một tài liệu lên hồ sơ đang mở. Nộp đè thì thay file cũ. */
  async uploadDocument(
    accountId: string,
    role: KycRole,
    docType: EKycDocumentType,
    buffer: Buffer,
    originalName: string | null,
  ): Promise<KycDocument> {
    const submission = await this.requireEditable(accountId, role);

    if (!ALLOWED_DOCUMENTS_BY_ROLE[role].includes(docType)) {
      throw new BadRequestException({
        businessCode: EBusinessCode.KYC_UNSUPPORTED_FILE,
        message: `document type ${EKycDocumentType[docType]} is not valid for ${role}`,
      });
    }

    // Mime THẬT đọc từ magic bytes, không tin đuôi tên lẫn Content-Type.
    const inspected = await inspectDocument(buffer, this.maxFileSize);

    // Kiểm tra chống nộp lại đúng file vừa bị từ chối mà không chỉnh sửa
    const previousRejected = await this.submissionRepository.findOne({
      where: { accountId, role, status: EKycStatus.REJECTED },
      order: { attemptNo: 'DESC', createdAt: 'DESC' },
    });
    if (previousRejected) {
      const rejectedDoc = await this.documentRepository.findOneBy({
        submissionId: previousRejected.id,
        docType,
      });
      if (
        rejectedDoc?.checksum &&
        rejectedDoc.checksum === inspected.checksum
      ) {
        throw new BadRequestException({
          businessCode: EBusinessCode.KYC_UNSUPPORTED_FILE,
          message:
            'cannot re-upload the exact identical document that was previously rejected; please provide clearer or updated documents',
        });
      }
    }

    const storageKey = this.storage.generateKey(STORAGE_PREFIX_PENDING);
    // Ghi ledger TRƯỚC khi put: object tồn tại mà không ai biết thì sweep
    // không bao giờ dọn được.
    await this.ledger.markPending(storageKey);
    await this.storage.put(storageKey, buffer, inspected.mimeType);

    // Thay file cũ cùng loại: xoá object cũ sau khi lưu file mới, tránh mồ côi
    const existing = await this.documentRepository.findOneBy({
      submissionId: submission.id,
      docType,
    });

    const saved = await this.dataSource.transaction(async (manager) => {
      const row = await manager.getRepository(KycDocument).save(
        this.documentRepository.create({
          id: existing?.id, // nếu có existing thì update tại chỗ
          submissionId: submission.id,
          docType,
          storageKey,
          originalName,
          mimeType: inspected.mimeType,
          sizeBytes: inspected.sizeBytes,
          checksum: inspected.checksum,
        }),
      );
      await this.ledger.markLinked(storageKey, manager);
      if (existing) {
        await this.ledger.markGarbage(existing.storageKey, manager);
      }
      return row;
    });

    // KHÔNG xoá object cũ tại đây: sweep lo, và nó retry được. Xoá đồng bộ ở
    // đây là lặp lại đúng lỗi cũ — I/O mạng cạnh transaction, hỏng thì mồ côi.
    return saved;
  }

  /** Chuyển hồ sơ sang PENDING. Thiếu giấy tờ bắt buộc thì không cho nộp. */
  async submit(accountId: string, role: KycRole): Promise<KycSubmission> {
    const submission = await this.requireEditable(accountId, role);

    const documents = await this.documentRepository.findBy({
      submissionId: submission.id,
    });
    const owned = new Set(documents.map((doc) => doc.docType));
    const missing = REQUIRED_DOCUMENTS[role].filter((type) => !owned.has(type));
    if (missing.length > 0) {
      throw new BadRequestException({
        businessCode: EBusinessCode.KYC_MISSING_DOCUMENTS,
        message: `missing documents: ${missing
          .map((type) => EKycDocumentType[type])
          .join(', ')}`,
      });
    }

    this.assertTransition(submission.status, EKycStatus.PENDING, role);

    submission.status = EKycStatus.PENDING;
    submission.submittedAt = new Date();
    return this.submissionRepository.save(submission);
  }

  /** Hồ sơ mới nhất của người gọi, kèm số lượt còn lại. */
  async findMine(
    accountId: string,
    role: KycRole,
  ): Promise<{
    submission: KycSubmission | null;
    documents: KycDocument[];
    attemptsLeft: number;
  }> {
    const submission = await this.findLatest(accountId, role);
    if (!submission) {
      return {
        submission: null,
        documents: [],
        attemptsLeft: MAX_KYC_ATTEMPTS,
      };
    }

    const documents = await this.documentRepository.findBy({
      submissionId: submission.id,
    });
    return {
      submission,
      documents,
      attemptsLeft: Math.max(0, MAX_KYC_ATTEMPTS - submission.attemptNo),
    };
  }

  /** Người dùng xem/tải tài liệu trong hồ sơ của chính mình. */
  async getDocumentForUser(
    accountId: string,
    role: KycRole,
    documentId: string,
  ): Promise<DocumentStreamPayload> {
    const document = await this.documentRepository.findOneBy({
      id: documentId,
    });
    if (!document) {
      throw new NotFoundException('document not found');
    }

    const submission = await this.submissionRepository.findOneBy({
      id: document.submissionId,
      accountId,
      role,
    });
    if (!submission) {
      throw new ForbiddenException('you do not have access to this document');
    }

    const streamResult = await this.storage.getStream(document.storageKey);
    return { document, streamResult };
  }

  // --------------------------------------------------------------------- admin

  /** Hàng đợi: ưu tiên trước, còn lại theo thứ tự nộp. */
  async findAll(query: KycFilterDto): Promise<PaginatedResult<KycListItem>> {
    const qb = this.submissionRepository
      .createQueryBuilder('kyc')
      .select(KYC_LIST_FIELDS.map((field) => `kyc.${field}`));

    if (query.status !== undefined) {
      qb.andWhere('kyc.status = :status', { status: query.status });
    }
    if (query.role) {
      qb.andWhere('kyc.role = :role', { role: query.role });
    }

    qb.orderBy('kyc.priority', 'DESC')
      .addOrderBy('kyc.submittedAt', 'ASC')
      // khoá thứ tự bằng id để phân trang ổn định khi trùng submittedAt
      .addOrderBy('kyc.id', 'ASC');

    return paginate(qb, query);
  }

  async findById(
    id: string,
  ): Promise<{ submission: KycSubmission; documents: KycDocument[] }> {
    const submission = await this.submissionRepository.findOneBy({ id });
    if (!submission) {
      throw new NotFoundException('kyc submission not found');
    }
    const documents = await this.documentRepository.findBy({
      submissionId: id,
    });
    return { submission, documents };
  }

  /**
   * Admin tải/xem tài liệu KYC: Ghi audit log TRƯỚC khi trả nội dung file stream.
   */
  async getDocumentForAdmin(
    submissionId: string,
    documentId: string,
    adminId: string,
    context: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<DocumentStreamPayload> {
    const document = await this.documentRepository.findOneBy({
      id: documentId,
      submissionId,
    });
    if (!document) {
      throw new NotFoundException('document not found in this submission');
    }

    // Ghi log audit trước khi stream file
    await this.recordDocumentView(document, adminId, context);

    const streamResult = await this.storage.getStream(document.storageKey);
    return { document, streamResult };
  }

  /* Duyệt / xin bổ sung / từ chối / thu hồi với Pessimistic Lock chống race condition.*/
  async review(
    id: string,
    dto: ReviewKycDto,
    reviewerId: string,
  ): Promise<KycSubmission> {
    const saved = await this.dataSource.transaction(async (manager) => {
      const submissionRepo = manager.getRepository(KycSubmission);
      const submission = await submissionRepo
        .createQueryBuilder('kyc')
        .setLock('pessimistic_write')
        .where('kyc.id = :id', { id })
        .getOne();

      if (!submission) {
        throw new NotFoundException('kyc submission not found');
      }

      this.assertTransition(submission.status, dto.status, ERole.ADMIN);

      if (dto.status === EKycStatus.REJECTED) {
        this.assertRejectPayload(dto);
      }
      if (dto.status === EKycStatus.MORE_INFO && !dto.reviewNote?.trim()) {
        throw new BadRequestException(
          'reviewNote is required when asking for more info',
        );
      }

      const exhausted = submission.attemptNo >= MAX_KYC_ATTEMPTS;
      const next =
        dto.status === EKycStatus.REJECTED && exhausted
          ? EKycStatus.LOCKED
          : dto.status;

      submission.status = next;
      submission.reviewedAt = new Date();
      submission.reviewedBy = reviewerId;
      submission.rejectReason = dto.rejectReason ?? null;
      submission.reviewNote = dto.reviewNote ?? null;
      if (next === EKycStatus.VERIFIED) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.validityDays);
        submission.expiresAt = expiresAt;
      }
      // Đổi status thì báo lại từ đầu.
      submission.notifiedAt = null;

      return submissionRepo.save(submission);
    });

    // Enqueue SAU commit. Gọi trong transaction là job có thể chạy trước khi
    // dữ liệu nhìn thấy được, và rollback thì email đã gửi mất rồi.
    if (saved.status === EKycStatus.VERIFIED) {
      await this.storageQueue.enqueuePromoteDocuments(saved.id);
    }
    await this.emailQueue.enqueueKycStatus(saved.id);

    return saved;
  }

  /** Ghi audit TRƯỚC khi trả nội dung: request đứt giữa chừng vẫn để lại vết. */
  async recordDocumentView(
    document: KycDocument,
    viewedBy: string,
    context: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<void> {
    await this.viewRepository.save(
      this.viewRepository.create({
        documentId: document.id,
        submissionId: document.submissionId,
        viewedBy,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
      }),
    );
  }

  // -------------------------------------------------------------------- private

  private findLatest(
    accountId: string,
    role: KycRole,
  ): Promise<KycSubmission | null> {
    return this.submissionRepository.findOne({
      where: { accountId, role },
      order: { attemptNo: 'DESC', createdAt: 'DESC' },
    });
  }

  /** Hồ sơ phải đang ở trạng thái người dùng sửa được. */
  private async requireEditable(
    accountId: string,
    role: KycRole,
  ): Promise<KycSubmission> {
    const latest = await this.findLatest(accountId, role);
    if (!latest || !OPEN_KYC_STATUSES.includes(latest.status)) {
      throw new NotFoundException('no open kyc submission');
    }
    if (latest.status === EKycStatus.PENDING) {
      throw new ConflictException('kyc submission is under review');
    }
    return latest;
  }

  private nextAttemptNo(latest: KycSubmission | null): number {
    if (!latest) {
      return 1;
    }
    // EXPIRED là chu kỳ KYC mới, không phải sửa lỗi lần cũ.
    if (latest.status === EKycStatus.EXPIRED) {
      return 1;
    }
    if (latest.status === EKycStatus.REJECTED) {
      return latest.attemptNo + 1;
    }
    return latest.attemptNo;
  }

  /** Copy song song các object sang khoá mới cho attempt tiếp theo. */
  private async carryOverDocuments(
    fromSubmissionId: string,
    toSubmissionId: string,
  ): Promise<void> {
    const previous = await this.documentRepository.findBy({
      submissionId: fromSubmissionId,
    });

    const activeDocs = previous.filter((doc) => !doc.deletedAt);
    const copiedDocs = await Promise.all(
      activeDocs.map(async (doc) => {
        const newKey = this.storage.generateKey(STORAGE_PREFIX_PENDING);
        // Ghi ledger TRƯỚC khi copy: object tồn tại mà không ai biết thì
        // sweep không bao giờ dọn được.
        await this.ledger.markPending(newKey);
        await this.storage.copy(doc.storageKey, newKey);
        return this.documentRepository.create({
          submissionId: toSubmissionId,
          docType: doc.docType,
          storageKey: newKey,
          originalName: doc.originalName,
          mimeType: doc.mimeType,
          sizeBytes: doc.sizeBytes,
          checksum: doc.checksum,
        });
      }),
    );

    if (copiedDocs.length > 0) {
      await this.dataSource.transaction(async (manager) => {
        await manager.getRepository(KycDocument).save(copiedDocs);
        for (const doc of copiedDocs) {
          await this.ledger.markLinked(doc.storageKey, manager);
        }
      });
    }
  }

  /** Chuyển song song sang tiền tố `verified/` khi duyệt. */
  private async moveDocumentsToVerified(submissionId: string): Promise<void> {
    const documents = await this.documentRepository.findBy({ submissionId });
    const pendingDocs = documents.filter((doc) =>
      doc.storageKey.startsWith(STORAGE_PREFIX_PENDING),
    );

    await Promise.all(
      pendingDocs.map(async (doc) => {
        const newKey = doc.storageKey.replace(
          STORAGE_PREFIX_PENDING,
          STORAGE_PREFIX_VERIFIED,
        );
        await this.storage.copy(doc.storageKey, newKey);
        await this.storage.remove(doc.storageKey);
        await this.documentRepository.update(
          { id: doc.id },
          { storageKey: newKey },
        );
      }),
    );
  }

  private assertRejectPayload(dto: ReviewKycDto): void {
    if (dto.rejectReason === undefined) {
      throw new BadRequestException('rejectReason is required when rejecting');
    }
    // DB có CHECK ràng buộc chuyện này, nhưng chặn ở đây để lỗi đọc được thay
    // vì để 23514 lọt ra ngoài.
    if (
      dto.rejectReason === EKycRejectReason.OTHER &&
      !dto.reviewNote?.trim()
    ) {
      throw new BadRequestException(
        "reviewNote is required when rejectReason is 'other'",
      );
    }
  }

  /** Lỗi dùng tên trạng thái chứ không phải số, để FE hiện thẳng cho người dùng. */
  private assertTransition(
    current: EKycStatus,
    next: EKycStatus,
    role: ERole,
  ): void {
    const transitions = KYC_TRANSITION_ACTORS[current];
    const actors = transitions[next];
    const from = KYC_STATUS_LABEL[current];
    const to = KYC_STATUS_LABEL[next];

    if (!actors) {
      const allowed = ALL_KYC_STATUSES.filter(
        (status) => transitions[status],
      ).map((status) => KYC_STATUS_LABEL[status]);
      throw new BadRequestException(
        allowed.length === 0
          ? `${from} is a final status and cannot be changed`
          : `cannot change status from ${from} to ${to}; allowed: ${allowed.join(', ')}`,
      );
    }

    if (!actors.includes(role)) {
      throw new ForbiddenException(
        `only ${actors.join(' or ')} can change status from ${from} to ${to}`,
      );
    }
  }
}
