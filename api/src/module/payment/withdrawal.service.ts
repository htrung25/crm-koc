import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { Transactional } from 'typeorm-transactional';
import { Withdrawal } from './entities/withdrawal.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { BankAccount } from './entities/bank-account.entity';
import { Repository } from 'typeorm';
import { WithdrawalDto } from './dto/withdrawal.dto';
import { WithdrawalFilterDto } from './dto/withdrawal-filter.dto';
import { isUUID } from 'class-validator';
import { validateListQuery } from '../../common/util/list-query.util';
import { paginate, PaginatedResult } from '../../common/util/pagination.util';
import { uniqueViolationOf } from '../../common/util/pg-error.util';
import { fromCents, percentOf, toCents } from '../../common/util/money.util';
import { assertPaymentRole } from '../../common/util/payment.util';
import { ESortField, ESortOrder } from '../../common/enum/sort-fields.enum';
import {
  EWalletTransactionsStatus,
  EWithdrawalStatus,
} from '../../common/enum/payment.enum';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import { ERole } from '../../common/enum/roles.enum';
import { SystemConfigurationService } from '../system-configuration/system-configuration.service';
import { KycService } from '../kyc/kyc.service';
import {
  WITHDRAWAL_CODE_ALPHABET,
  WITHDRAWAL_CODE_LENGTH,
  WITHDRAWAL_CODE_PREFIX,
  WITHDRAWAL_FEE_PERCENT_KEY,
} from './constants/payment.constants';

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    private readonly configService: SystemConfigurationService,
    private readonly kycService: KycService,
  ) {}

  async createWithdrawal(
    accountId: string,
    role: ERole | null,
    dto: WithdrawalDto,
    idempotencyKey?: string,
  ): Promise<Withdrawal> {
    assertPaymentRole(role);
    // KYC tính theo (account, role): account có cả hai vai trò phải KYC đúng
    // vai trò đang dùng. isVerified đã coi hồ sơ quá expiresAt là chưa KYC.
    if (!(await this.kycService.isVerified(accountId, role))) {
      throw new ForbiddenException({
        businessCode: EBusinessCode.WITHDRAWAL_KYC_REQUIRED,
        message: 'kyc must be verified before withdrawing',
      });
    }

    if (idempotencyKey) {
      const existing = await this.withdrawalRepository.findOneBy({
        accountId,
        idempotencyKey,
      });
      if (existing) {
        return existing;
      }
    }

    try {
      return await this.insertWithdrawal(accountId, dto, idempotencyKey);
    } catch (error) {
      // Request song song cùng key: bên kia thắng, transaction bên này đã
      // rollback nên ví không bị trừ hai lần; trả về lệnh của bên thắng.
      if (
        idempotencyKey &&
        uniqueViolationOf(error) === 'UQ_withdrawals_account_idempotency'
      ) {
        return this.withdrawalRepository.findOneByOrFail({
          accountId,
          idempotencyKey,
        });
      }
      throw error;
    }
  }

  @Transactional()
  private async insertWithdrawal(
    accountId: string,
    dto: WithdrawalDto,
    idempotencyKey?: string,
  ): Promise<Withdrawal> {
    const bankAccount = await this.bankAccountRepository.findOneBy({
      id: dto.bankAccountId,
      accountId,
    });
    if (!bankAccount) {
      throw new NotFoundException('bank account does not exist');
    }

    const amountCents = toCents(dto.amount);
    if (amountCents <= 0n) {
      throw new BadRequestException('amount must be greater than 0');
    }
    const feeCents = percentOf(amountCents, await this.feePercent());
    if (feeCents >= amountCents) {
      throw new BadRequestException('amount is too small to cover the fee');
    }
    const amount = fromCents(amountCents);

    // Trừ có điều kiện trong một câu: hai lệnh rút song song không thể cùng lọt
    // qua, bên đến sau thấy available_balance đã giảm và nhận 0 dòng.
    const debited = await this.walletRepository
      .createQueryBuilder()
      .update(Wallet)
      .set({
        availableBalance: () => 'available_balance - :amount',
        lockedBalance: () => 'locked_balance + :amount',
      })
      .where('account_id = :accountId AND available_balance >= :amount')
      .setParameters({ accountId, amount })
      .returning('id')
      .execute();
    const walletId = (debited.raw as { id: string }[])[0]?.id;
    if (!walletId) {
      throw new UnprocessableEntityException({
        businessCode: EBusinessCode.WITHDRAWAL_INSUFFICIENT_BALANCE,
        message: 'available balance is less than the withdrawal amount',
      });
    }

    const withdrawal = await this.withdrawalRepository.save(
      this.withdrawalRepository.create({
        accountId,
        bankAccountId: bankAccount.id,
        bankCode: bankAccount.bankCode,
        bankNumber: bankAccount.bankNumber,
        bankName: bankAccount.bankName,
        accountHolderName: bankAccount.accountHolderName,
        amount,
        fee: fromCents(feeCents),
        status: EWithdrawalStatus.PENDING,
        transactionCode: this.generateCode(),
        idempotencyKey: idempotencyKey ?? null,
      }),
    );

    await this.walletTransactionRepository.insert({
      walletId,
      amount: `-${amount}`,
      status: EWalletTransactionsStatus.PENDING,
      withdrawalId: withdrawal.id,
    });

    // Đọc lại để có net_amount do DB tính.
    return this.withdrawalRepository.findOneByOrFail({ id: withdrawal.id });
  }

  private async feePercent(): Promise<number> {
    const percent = await this.configService.getNumber(
      WITHDRAWAL_FEE_PERCENT_KEY,
    );
    // Config hỏng thì dừng hẳn, không được rút với mức phí đoán mò.
    if (!Number.isFinite(percent) || percent < 0 || percent >= 100) {
      throw new ServiceUnavailableException(
        `${WITHDRAWAL_FEE_PERCENT_KEY} is misconfigured`,
      );
    }
    return percent;
  }

  // ponytail: 32^10 ≈ 1e15 mã; đụng nhau thì transaction rollback và trả 500,
  // thêm vòng thử lại (cần savepoint) khi lượng lệnh rút đủ lớn.
  private generateCode(): string {
    const bytes = randomBytes(WITHDRAWAL_CODE_LENGTH);
    let code = '';
    for (const byte of bytes) {
      code += WITHDRAWAL_CODE_ALPHABET[byte % WITHDRAWAL_CODE_ALPHABET.length];
    }
    return `${WITHDRAWAL_CODE_PREFIX}${code}`;
  }

  async findAll(
    accountId: string,
    query: WithdrawalFilterDto = {},
  ): Promise<PaginatedResult<Withdrawal>> {
    if (typeof accountId !== 'string' || !isUUID(accountId)) {
      throw new BadRequestException('invalid accountId');
    }
    const filters = validateListQuery(WithdrawalFilterDto, query);
    const sortBy = filters.sortBy ?? ESortField.CREATED_AT;
    const sortOrder = filters.sortOrder ?? ESortOrder.DESC;

    // sortBy đã qua IsIn nên chỉ có tên cột do server định nghĩa lọt vào SQL.
    const qb = this.withdrawalRepository
      .createQueryBuilder('withdrawal')
      .where('withdrawal.accountId = :accountId', { accountId })
      .orderBy(`withdrawal.${sortBy}`, sortOrder)
      .addOrderBy('withdrawal.id', ESortOrder.ASC);

    return paginate(qb, filters);
  }
}
