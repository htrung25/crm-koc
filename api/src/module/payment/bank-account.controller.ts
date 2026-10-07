import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
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
import { BankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';

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
  async createBankAccount(
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: BankAccountDto,
  ) {
    return this.bankAccountService.createBankAccount(
      request.user.id,
      request.user.accountRole,
      dto,
    );
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

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a bank account',
    description: 'Only the owner can update. Absent fields are left untouched.',
  })
  @ApiOkResponse({ description: 'Bank account updated' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiNotFoundResponse({
    description: 'Bank account does not exist or belongs to another account',
  })
  async updateBankAccount(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.bankAccountService.updateBankAccount(id, request.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bank account' })
  @ApiOkResponse({ description: 'Bank account deleted' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiNotFoundResponse({
    description: 'Bank account does not exist or belongs to another account',
  })
  async removeBankAccount(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bankAccountService.removeBankAccount(id, request.user.id);
  }
}
