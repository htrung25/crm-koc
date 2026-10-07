import { Module } from '@nestjs/common';
import { BankAccountController } from './bank-account.controller';
import { BankAccountService } from './bank-account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { Withdrawal } from './entities/withdrawal.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { WithdrawalController } from './withdrawal.controller';
import { WithdrawalService } from './withdrawal.service';
import { SystemConfigurationModule } from '../system-configuration/system-configuration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankAccount,
      Withdrawal,
      Wallet,
      WalletTransaction,
    ]),
    SystemConfigurationModule,
  ],
  controllers: [BankAccountController, WithdrawalController],
  providers: [BankAccountService, WithdrawalService],
  exports: [BankAccountService, WithdrawalService],
})
export class PaymentModule {}
