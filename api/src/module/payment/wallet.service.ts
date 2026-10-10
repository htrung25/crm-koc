import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { EWalletTransactionsStatus } from '../../common/enum/payment.enum';
import { ERole } from '../../common/enum/roles.enum';
import { ESortOrder } from '../../common/enum/sort-fields.enum';
import { assertPaymentRole } from '../../common/util/payment.util';
import { validateListQuery } from '../../common/util/list-query.util';
import { paginate, PaginatedResult } from '../../common/util/pagination.util';
import { WalletTransactionFilterDto } from './dto/wallet-transaction-filter.dto';
import type {
  WalletBalance,
  WalletSource,
  WalletTransactionItem,
} from './types/payment.types';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepository: Repository<WalletTransaction>,
  ) {}

  async ensureWallet(accountId: string): Promise<string> {
    await this.walletRepository
      .createQueryBuilder()
      .insert()
      .into(Wallet)
      .values({ accountId })
      .orIgnore()
      .execute();
    const wallet = await this.walletRepository.findOneByOrFail({ accountId });
    return wallet.id;
  }

  async getMyWallet(
    accountId: string,
    role: ERole | null,
  ): Promise<WalletBalance> {
    assertPaymentRole(role);
    const wallet = await this.walletRepository.findOne({
      where: { accountId },
      select: { availableBalance: true, lockedBalance: true },
    });
    // Chưa có ví (account trước backfill) coi như số dư 0, không 404.
    return wallet ?? { availableBalance: '0.00', lockedBalance: '0.00' };
  }

  async findMyTransactions(
    accountId: string,
    role: ERole | null,
    query: WalletTransactionFilterDto = {},
  ): Promise<PaginatedResult<WalletTransactionItem>> {
    assertPaymentRole(role);
    const filters = validateListQuery(WalletTransactionFilterDto, query);
    // Ràng qua wallets.account_id: không có ví thì ra trang rỗng.
    const qb = this.walletTransactionRepository
      .createQueryBuilder('tx')
      .innerJoin(Wallet, 'wallet', 'wallet.id = tx.walletId')
      .select([
        'tx.id',
        'tx.amount',
        'tx.status',
        'tx.collaborationId',
        'tx.withdrawalId',
        'tx.depositId',
        'tx.campaignId',
        'tx.completedAt',
        'tx.createdAt',
      ])
      .where('wallet.accountId = :accountId', { accountId })
      .orderBy('tx.createdAt', ESortOrder.DESC)
      .addOrderBy('tx.id', ESortOrder.ASC);
    return paginate(qb, filters);
  }

  // false = hợp tác này đã được trả trước đó (gọi lại), bên gọi không được chi thêm.
  async creditEarning(
    creatorId: string,
    collaborationId: string,
    agreedPrice: string,
  ): Promise<boolean> {
    return this.credit(creatorId, agreedPrice, { collaborationId });
  }

  // Gọi trong transaction đánh dấu lệnh nạp hoàn tất.
  async creditDeposit(
    accountId: string,
    depositId: string,
    amount: string,
  ): Promise<void> {
    await this.credit(accountId, amount, { depositId });
  }

  async credit(
    accountId: string,
    amount: string,
    source: WalletSource,
  ): Promise<boolean> {
    const walletId = await this.ensureWallet(accountId);
    const inserted = await this.walletTransactionRepository
      .createQueryBuilder()
      .insert()
      .into(WalletTransaction)
      .values({
        walletId,
        amount,
        status: EWalletTransactionsStatus.COMPLETED,
        completedAt: new Date(),
        ...source,
      })
      .orIgnore()
      .returning('id')
      .execute();
    if ((inserted.raw as unknown[]).length === 0) {
      return false;
    }

    await this.walletRepository
      .createQueryBuilder()
      .update(Wallet)
      .set({ availableBalance: () => 'available_balance + :amount' })
      .where('id = :walletId')
      .setParameters({ walletId, amount })
      .execute();
    return true;
  }

  // Brand trả vào ký quỹ campaign
  async debit(
    accountId: string,
    amount: string,
    campaignId: string,
  ): Promise<boolean> {
    const debited = await this.walletRepository
      .createQueryBuilder()
      .update(Wallet)
      .set({ availableBalance: () => 'available_balance - :amount' })
      .where('account_id = :accountId AND available_balance >= :amount')
      .setParameters({ accountId, amount })
      .returning('id')
      .execute();
    const walletId = (debited.raw as { id: string }[])[0]?.id;
    if (!walletId) {
      return false;
    }

    await this.walletTransactionRepository.insert({
      walletId,
      amount: `-${amount}`,
      status: EWalletTransactionsStatus.COMPLETED,
      completedAt: new Date(),
      campaignId,
    });
    return true;
  }

  async availableBalance(accountId: string): Promise<string> {
    const wallet = await this.walletRepository.findOne({
      where: { accountId },
      select: { availableBalance: true },
    });
    return wallet?.availableBalance ?? '0';
  }
}
