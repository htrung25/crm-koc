import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { ERole } from '../../common/enum/roles.enum';
import type { AuthenticatedAccount } from '../auth/types/authenticated.types';
import { WalletService } from './wallet.service';
import { WalletTransactionFilterDto } from './dto/wallet-transaction-filter.dto';

// Chỉ đọc: số dư chỉ đổi qua nạp, rút và tiền công, luôn kèm dòng ledger.
@ApiTags('Wallet')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.CREATOR, ERole.BRAND)
@Controller('payment/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get my wallet balance' })
  @ApiOkResponse({
    description:
      'availableBalance can be withdrawn; lockedBalance is held by pending withdrawals',
  })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a creator or brand account' })
  async getMyWallet(@Request() request: { user: AuthenticatedAccount }) {
    return this.walletService.getMyWallet(
      request.user.id,
      request.user.accountRole,
    );
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'List my wallet transactions',
    description:
      'Signed amount: positive is money in, negative is money out. Exactly ' +
      'one of collaborationId, withdrawalId, depositId tells the source.',
  })
  @ApiOkResponse({ description: 'A page of transactions, newest first' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a creator or brand account' })
  async findMyTransactions(
    @Request() request: { user: AuthenticatedAccount },
    @Query() query: WalletTransactionFilterDto,
  ) {
    return this.walletService.findMyTransactions(
      request.user.id,
      request.user.accountRole,
      query,
    );
  }
}
