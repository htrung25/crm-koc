import {
  validateListQuery,
  applyEqualityFilters,
} from '../../common/util/list-query.util';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { Repository } from 'typeorm';
import { BankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';
import { paginate, PaginatedResult } from '../../common/util/pagination.util';
import { isUUID } from 'class-validator';
import { ESortField, ESortOrder } from '../../common/enum/sort-fields.enum';
import { BankAccountFilterDto } from './dto/bank-account-filter.dto';
import { ERole } from '../../common/enum/roles.enum';
import { assertPaymentRole } from '../../common/util/payment.util';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
  ) {}

  async createBankAccount(
    accountId: string,
    role: ERole | null,
    dto: BankAccountDto,
  ) {
    assertPaymentRole(role);
    const payment = this.bankAccountRepository.create({
      accountId,
      bankCode: dto.bankCode,
      bankNumber: dto.bankNumber,
      bankName: dto.bankName,
      accountHolderName: dto.accountHolderName,
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
    const sortBy = filters.sortBy ?? ESortField.CREATED_AT;
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

  async updateBankAccount(
    id: string,
    accountId: string,
    dto: UpdateBankAccountDto,
  ): Promise<{ message: string }> {
    const account = await this.bankAccountRepository.findOne({
      where: { id, accountId },
    });
    if (!account) {
      throw new NotFoundException(
        'Bank account not found or you do not have ownership rights.',
      );
    }
    // Liệt kê cột tường minh: dto không được ghi đè id/accountId.
    await this.bankAccountRepository.update(id, {
      bankCode: dto.bankCode,
      bankNumber: dto.bankNumber,
      bankName: dto.bankName,
      accountHolderName: dto.accountHolderName,
      isDefault: dto.isDefault,
    });
    return { message: 'Bank account successfully updated.' };
  }

  async removeBankAccount(
    id: string,
    accountId: string,
  ): Promise<{ message: string }> {
    const account = await this.bankAccountRepository.findOne({
      where: { id, accountId },
    });
    if (!account) {
      throw new NotFoundException(
        'Bank account not found or you do not have ownership rights.',
      );
    }
    await this.bankAccountRepository.delete(id);
    return { message: 'Bank account successfully deleted.' };
  }
}
