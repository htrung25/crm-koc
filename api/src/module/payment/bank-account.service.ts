import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { Repository } from 'typeorm';
import { BankAccountDto } from './dto/bank-account.dto';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
  ) {}

  async createBank(dto: BankAccountDto) {
    const payment = this.bankAccountRepository.create({
      accountId: dto.accountId,
      bankCode: dto.bankCode,
      bankNumber: dto.bankNumber,
      bankName: dto.bankName,
      isDefault: dto.isDefault,
    });
    await this.bankAccountRepository.save(payment);
    return payment;
  }

  async findAll(): Promise<BankAccount[]> {
    const data = await this.bankAccountRepository.find();
    return data;
  }
}
