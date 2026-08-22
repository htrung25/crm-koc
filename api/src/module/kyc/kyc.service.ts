import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import {
  EKycDocumentType,
  EKycRejectReason,
  EKycStatus,
} from '../../common/enum/kyc.enum';
import { ERole } from '../../common/enum/roles.enum';
import { PaginatedResult, paginate } from '../../common/util/pagination.util';
import { StorageService } from '../../common/services/storage.service';
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

@Injectable()
export class KycService {
  private readonly maxFileSize: number;

  constructor(
    @InjectRepository(KycSubmission)
    private readonly submissionRepository: Repository<KycSubmission>,
    @InjectRepository(KycDocument)
    private readonly documentRepository: Repository<KycDocument>,
    @InjectRepository(KycDocumentView)
    private readonly viewRepository: Repository<KycDocumentView>,
    private readonly storage: StorageService,
    configService: ConfigService,
  ) {
    // .env luôn trả chuỗi nên phải Number()
    this.maxFileSize = Number(
      configService.get('KYC_MAX_FILE_SIZE_BYTES', 10_485_760),
    );
  }

  // ---------------------------------------------------------------- người dùng

  async openSubmission(
    accountId: string,
    role: KycRole,
  ): Promise<KycSubmission> {
    const latest = await this.findLatest(accountId, role);

    if (latest && OPEN_KYC_STATUSES.includes(latest.status)) {
      return latest;
    }

    // LOCKED (6) nằm NGOÀI partial unique index nên DB không chặn được việc
    // tạo DRAFT mới. Phải chặn ở đây.
    if (latest?.status === EKycStatus.LOCKED) {
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

    const storageKey = await this.storage.generateKey(STORAGE_PREFIX_PENDING);
    await this.storage.put(storageKey, buffer, inspected.mimeType);

    // Thay file cũ cùng loại: xoá object trước rồi mới ghi đè dòng, tránh bỏ
    // lại object mồ côi không ai trỏ tới.
    const existing = await this.documentRepository.findOneBy({
      submissionId: submission.id,
      docType,
    });
    if (existing) {
      await this.storage.remove(existing.storageKey);
      await this.documentRepository.delete({ id: existing.id });
    }

    return this.documentRepository.save(
      this.documentRepository.create({
        submissionId: submission.id,
        docType,
        storageKey,
        originalName,
        mimeType: inspected.mimeType,
        sizeBytes: inspected.sizeBytes,
        checksum: inspected.checksum,
      }),
    );
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

  /* Duyệt / xin bổ sung / từ chối / thu hồi.*/
  async review(
    id: string,
    dto: ReviewKycDto,
    reviewerId: string,
  ): Promise<KycSubmission> {
    const submission = await this.submissionRepository.findOneBy({ id });
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

    if (next === EKycStatus.VERIFIED) {
      await this.moveDocumentsToVerified(submission.id);
    }

    submission.status = next;
    submission.reviewedAt = new Date();
    submission.reviewedBy = reviewerId;
    submission.rejectReason = dto.rejectReason ?? null;
    submission.reviewNote = dto.reviewNote ?? null;
    return this.submissionRepository.save(submission);
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

  // -------------------------------------------------------------------- riêng tư

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

  /** Copy object phía R2 sang khoá mới: mỗi dòng tài liệu sở hữu một object. */
  private async carryOverDocuments(
    fromSubmissionId: string,
    toSubmissionId: string,
  ): Promise<void> {
    const previous = await this.documentRepository.findBy({
      submissionId: fromSubmissionId,
    });

    for (const doc of previous) {
      if (doc.deletedAt) {
        continue;
      }
      const newKey = await this.storage.generateKey(STORAGE_PREFIX_PENDING);
      await this.storage.copy(doc.storageKey, newKey);
      await this.documentRepository.save(
        this.documentRepository.create({
          submissionId: toSubmissionId,
          docType: doc.docType,
          storageKey: newKey,
          originalName: doc.originalName,
          mimeType: doc.mimeType,
          sizeBytes: doc.sizeBytes,
          checksum: doc.checksum,
        }),
      );
    }
  }

  /**
   * Chuyển sang tiền tố `verified/` khi duyệt.
   */
  private async moveDocumentsToVerified(submissionId: string): Promise<void> {
    const documents = await this.documentRepository.findBy({ submissionId });

    for (const doc of documents) {
      if (doc.storageKey.startsWith(STORAGE_PREFIX_VERIFIED)) {
        continue;
      }
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
    }
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
