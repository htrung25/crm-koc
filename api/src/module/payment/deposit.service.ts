import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Deposit } from './entities/deposit.entity';
import { DepositDto } from './dto/deposit.dto';
import { DepositFilterDto } from './dto/deposit-filter.dto';
import { WalletService } from './wallet.service';
import { EDepositMethod, EDepositStatus } from '../../common/enum/payment.enum';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import { ERole } from '../../common/enum/roles.enum';
import { ESortOrder } from '../../common/enum/sort-fields.enum';
import { assertPaymentRole } from '../../common/util/payment.util';
import { fromCents, toCents } from '../../common/util/money.util';
import { validateListQuery } from '../../common/util/list-query.util';
import { paginate, PaginatedResult } from '../../common/util/pagination.util';
import {
  DEPOSIT_CODE_LENGTH,
  DEPOSIT_CODE_PATTERN,
  DEPOSIT_CODE_PREFIX,
  SEPAY_AUTH_SCHEME,
  SEPAY_QR_BASE_URL,
  SEPAY_TRANSFER_IN,
  WITHDRAWAL_CODE_ALPHABET,
} from './constants/payment.constants';
import type { DepositWithQr, SepayWebhookPayload } from './types/payment.types';

@Injectable()
export class DepositService {
  private readonly logger = new Logger(DepositService.name);

  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    private readonly walletService: WalletService,
    private readonly config: ConfigService,
  ) {}

  async createSepayDeposit(
    accountId: string,
    role: ERole | null,
    dto: DepositDto,
  ): Promise<DepositWithQr> {
    assertPaymentRole(role);
    const bank = this.sepayBank();
    const amountCents = toCents(dto.amount);
    if (amountCents <= 0n) {
      throw new BadRequestException('amount must be greater than 0');
    }

    // ponytail: mã đụng UQ_deposits_payment_code thì trả 500, 32^10 ≈ 1e15 mã;
    // thêm vòng thử lại khi lượng lệnh nạp đủ lớn.
    const deposit = await this.depositRepository.save(
      this.depositRepository.create({
        accountId,
        method: EDepositMethod.SEPAY,
        amount: fromCents(amountCents),
        paymentCode: this.generateCode(),
      }),
    );
    return this.withQr(deposit, bank);
  }

  async findAll(
    accountId: string,
    query: DepositFilterDto = {},
  ): Promise<PaginatedResult<Deposit>> {
    const filters = validateListQuery(DepositFilterDto, query);
    const qb = this.depositRepository
      .createQueryBuilder('deposit')
      .where('deposit.accountId = :accountId', { accountId })
      .orderBy('deposit.createdAt', ESortOrder.DESC)
      .addOrderBy('deposit.id', ESortOrder.ASC);
    return paginate(qb, filters);
  }

  // FE gọi lại để hiện lại QR và hỏi trạng thái sau khi user chuyển khoản.
  async findOne(accountId: string, id: string): Promise<DepositWithQr> {
    const deposit = await this.depositRepository.findOneBy({ id, accountId });
    if (!deposit) {
      throw new NotFoundException('deposit does not exist');
    }
    return this.withQr(deposit, this.sepayBank());
  }

  async handleSepayWebhook(
    authorization: string | undefined,
    payload: unknown,
  ): Promise<{ success: true }> {
    this.assertSepayAuth(authorization);
    const transfer = this.parseSepayPayload(payload);

    // Giao dịch tiền ra hoặc không mang mã nạp vẫn trả success: báo lỗi thì
    // SePay retry 7 lần trong 5 giờ cho một giao dịch không bao giờ khớp.
    if (transfer.transferType !== SEPAY_TRANSFER_IN) {
      return { success: true };
    }
    const code = this.extractCode(transfer);
    if (!code) {
      this.logger.warn(
        `sepay transaction ${transfer.id} has no deposit code, content="${transfer.content}"`,
      );
      return { success: true };
    }

    await this.completeSepayDeposit(code, transfer);
    return { success: true };
  }

  @Transactional()
  private async completeSepayDeposit(
    code: string,
    transfer: SepayWebhookPayload,
  ): Promise<void> {
    const paidAmount = fromCents(BigInt(transfer.transferAmount) * 100n);

    // Điều kiện status = PENDING: SePay retry hoặc hai webhook song song thì
    // chỉ một bên cập nhật được, bên kia nhận 0 dòng và dừng.
    const updated = await this.depositRepository
      .createQueryBuilder()
      .update(Deposit)
      .set({
        status: EDepositStatus.COMPLETED,
        paidAmount,
        completedAt: () => 'now()',
        providerTransactionId: String(transfer.id),
        // Kiểu set() của TypeORM không nhận object tuỳ ý cho jsonb; vẫn là tham số bind.
        providerPayload: () => 'CAST(:payload AS jsonb)',
      })
      .where('payment_code = :code AND method = :method AND status = :pending')
      .setParameters({
        payload: JSON.stringify(transfer),
        code,
        method: EDepositMethod.SEPAY,
        pending: EDepositStatus.PENDING,
      })
      // Chuỗi SQL, không dùng mảng: mảng bị hiểu là tên property, account_id ra null.
      .returning('"id", "account_id"')
      .execute();
    const row = (updated.raw as { id: string; account_id: string }[])[0];
    if (!row) {
      // ponytail: user chuyển khoản lần hai vào mã đã hoàn tất thì tiền về
      // nhưng không tự cộng — chỉ log để xử lý tay; thêm bảng giao dịch lạ nếu hay gặp.
      this.logger.warn(
        `sepay transaction ${transfer.id} matched no pending deposit for code ${code}`,
      );
      return;
    }

    // Cộng số tiền thực nhận, không phải số yêu cầu: user chuyển thiếu/thừa
    // thì ví phản ánh đúng tiền đã về tài khoản.
    await this.walletService.creditDeposit(row.account_id, row.id, paidAmount);
  }

  private assertSepayAuth(authorization: string | undefined): void {
    const key = this.config.get<string>('SEPAY_WEBHOOK_API_KEY');
    // Chưa cấu hình key thì từ chối hết, không bao giờ nhận webhook không xác thực.
    if (!key) {
      throw new ServiceUnavailableException('sepay webhook is not configured');
    }
    const expected = Buffer.from(`${SEPAY_AUTH_SCHEME} ${key}`);
    const actual = Buffer.from(authorization ?? '');
    if (
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected)
    ) {
      throw new UnauthorizedException('invalid sepay api key');
    }
  }

  private parseSepayPayload(payload: unknown): SepayWebhookPayload {
    const p = (payload ?? {}) as Partial<SepayWebhookPayload>;
    if (
      !Number.isSafeInteger(p.id) ||
      typeof p.transferType !== 'string' ||
      typeof p.content !== 'string' ||
      !Number.isSafeInteger(p.transferAmount) ||
      (p.transferAmount as number) <= 0
    ) {
      throw new BadRequestException('invalid sepay webhook payload');
    }
    return p as SepayWebhookPayload;
  }

  // Ưu tiên code SePay đã tách sẵn; ngân hàng có thể chèn thêm chữ vào nội
  // dung nên dò lại bằng regex trên content.
  private extractCode(transfer: SepayWebhookPayload): string | null {
    for (const text of [transfer.code, transfer.content]) {
      const match = text?.toUpperCase().match(DEPOSIT_CODE_PATTERN);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  private sepayBank(): { bankCode: string; accountNumber: string } {
    const bankCode = this.config.get<string>('SEPAY_BANK_CODE');
    const accountNumber = this.config.get<string>('SEPAY_BANK_ACCOUNT_NUMBER');
    if (!bankCode || !accountNumber) {
      throw new ServiceUnavailableException({
        businessCode: EBusinessCode.DEPOSIT_METHOD_UNAVAILABLE,
        message: 'bank transfer deposit is not configured',
      });
    }
    return { bankCode, accountNumber };
  }

  private withQr(
    deposit: Deposit,
    bank: { bankCode: string; accountNumber: string },
  ): DepositWithQr {
    const params = new URLSearchParams({
      acc: bank.accountNumber,
      bank: bank.bankCode,
      amount: String(toCents(deposit.amount) / 100n),
      des: deposit.paymentCode,
      template: 'compact',
    });
    return {
      deposit,
      transferContent: deposit.paymentCode,
      bankCode: bank.bankCode,
      accountNumber: bank.accountNumber,
      qrUrl: `${SEPAY_QR_BASE_URL}?${params.toString()}`,
    };
  }

  private generateCode(): string {
    const bytes = randomBytes(DEPOSIT_CODE_LENGTH);
    let code = '';
    for (const byte of bytes) {
      code += WITHDRAWAL_CODE_ALPHABET[byte % WITHDRAWAL_CODE_ALPHABET.length];
    }
    return `${DEPOSIT_CODE_PREFIX}${code}`;
  }
}
