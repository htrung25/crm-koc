import { Controller, Get, Post, Query, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';
import { RolesGuard } from '../../security/roles.guard';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { ERole } from '../../common/enum/roles.enum';
import { Roles } from '../../security/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { BankAccountService } from './bank-account.service';
import { ApiUnauthorizedResponse } from '@nestjs/swagger';
import { BankAccountFilterDto } from './dto/bank-account-filter.dto';
import type { AuthenticatedAccount } from '../auth/types/authenticated.types';
import { BankAccountDto } from './dto/bank-account.dto';

@ApiTags('Bank Accounts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.CREATOR, ERole.BRAND)
@Controller('payment/bank-accounts')
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new bank account',
    description: 'Creates a new bank account for the authenticated user',
  })
  @ApiCreatedResponse({ type: BankAccountDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  async createBankAccount() {
    // Implementation for creating a new bank account
  }

  @Get()
  @ApiOperation({
    summary: 'Get all bank accounts',
    description:
      'Retrieves a list of all bank accounts for the authenticated user',
  })
  @ApiOkResponse({ description: 'A list of all bank accounts' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  async findAll(
    @Request() request: { user: AuthenticatedAccount },
    @Query() dto: BankAccountFilterDto,
  ) {
    return this.bankAccountService.findAll(request.user.id, dto);
  }
}
