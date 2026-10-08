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
import { WalletService } from './wallet.service';
import { Deposit } from './entities/deposit.entity';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { SepayWebhookController } from './sepay-webhook.controller';
import { SystemConfigurationModule } from '../system-configuration/system-configuration.module';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankAccount,
      Withdrawal,
      Wallet,
      WalletTransaction,
      Deposit,
    ]),
    SystemConfigurationModule,
    KycModule,
  ],
  controllers: [
    BankAccountController,
    WithdrawalController,
    DepositController,
    SepayWebhookController,
  ],
  providers: [
    BankAccountService,
    WithdrawalService,
    WalletService,
    DepositService,
  ],
  exports: [BankAccountService, WithdrawalService, WalletService],
})
export class PaymentModule {}
