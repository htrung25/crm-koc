import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { EWalletTransactionsStatus } from '../../common/enum/payment.enum';

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

  async creditEarning(
    creatorId: string,
    collaborationId: string,
    agreedPrice: string,
  ): Promise<void> {
    await this.credit(creatorId, agreedPrice, { collaborationId });
  }

  // Gọi trong transaction đánh dấu lệnh nạp hoàn tất.
  async creditDeposit(
    accountId: string,
    depositId: string,
    amount: string,
  ): Promise<void> {
    await this.credit(accountId, amount, { depositId });
  }

  // Ledger trước, số dư sau: nguồn đã được ghi (unique theo nguồn) thì bỏ qua,
  // nên gọi lại không cộng tiền hai lần.
  private async credit(
    accountId: string,
    amount: string,
    source: { collaborationId: string } | { depositId: string },
  ): Promise<void> {
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
      return;
    }

    await this.walletRepository
      .createQueryBuilder()
      .update(Wallet)
      .set({ availableBalance: () => 'available_balance + :amount' })
      .where('id = :walletId')
      .setParameters({ walletId, amount })
      .execute();
  }
}
