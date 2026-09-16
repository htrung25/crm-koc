import {
  validateListQuery,
  applyEqualityFilters,
} from '../../common/util/list-query.util';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { Repository } from 'typeorm';
import { BankAccountDto } from './dto/bank-account.dto';
import { paginate, PaginatedResult } from '../../common/util/pagination.util';
import { isUUID } from 'class-validator';
import { ESortOrder } from '../../common/enum/sort-fields.enum';
import {
  BankAccountFilterDto,
  EBankAccountSortField,
} from './dto/bank-account-filter.dto';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
  ) {}

  async createBankAccount(dto: BankAccountDto) {
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

  async findAll(
    accountId: string,
    query: BankAccountFilterDto = {},
  ): Promise<PaginatedResult<BankAccount>> {
    // Validate before allocating a QueryBuilder, including direct service callers.
    if (typeof accountId !== 'string' || !isUUID(accountId)) {
      throw new BadRequestException('invalid accountId');
    }
    const filters = validateListQuery(BankAccountFilterDto, query);
    const sortBy = filters.sortBy ?? EBankAccountSortField.CREATED_AT;
    const sortOrder = filters.sortOrder ?? ESortOrder.DESC;

    const qb = this.bankAccountRepository
      .createQueryBuilder('bankAccount')
      .where('bankAccount.accountId = :accountId', { accountId });

    // Only server-defined columns are interpolated; client values stay bound.
    const equalityFilters = {
      bankCode: filters.bankCode,
      bankNumber: filters.bankNumber,
      bankName: filters.bankName,
      isDefault: filters.isDefault,
    };
    applyEqualityFilters(qb, 'bankAccount', equalityFilters);
    qb.orderBy(`bankAccount.${sortBy}`, sortOrder).addOrderBy(
      'bankAccount.id',
      ESortOrder.ASC,
    );

    return paginate(qb, filters);
  }
}
