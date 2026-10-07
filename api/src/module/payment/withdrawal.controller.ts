import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { ERole } from '../../common/enum/roles.enum';
import type { AuthenticatedAccount } from '../auth/types/authenticated.types';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalFilterDto } from './dto/withdrawal-filter.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';
import {
  MAX_WITHDRAWAL_IDEMPOTENCY_KEY_LENGTH,
  WITHDRAWAL_IDEMPOTENCY_HEADER,
} from './constants/payment.constants';

@ApiTags('Withdrawals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.CREATOR, ERole.BRAND)
@Controller('payment/withdrawals')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post()
  @ApiOperation({
    summary: 'Request a withdrawal',
    description:
      'Moves amount from available to locked balance and creates a pending ' +
      'withdrawal for admin review. Fee is taken from amount at the current ' +
      'rate. Replaying the same Idempotency-Key returns the first withdrawal.',
  })
  @ApiHeader({
    name: WITHDRAWAL_IDEMPOTENCY_HEADER,
    required: false,
    description: 'Client-generated string, uuid recommended.',
  })
  @ApiCreatedResponse({ description: 'Withdrawal created, status pending' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a creator or brand account' })
  @ApiNotFoundResponse({ description: 'Bank account does not exist' })
  @ApiUnprocessableEntityResponse({
    description: 'Available balance is not enough',
  })
  async create(
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: WithdrawalDto,
    @Headers(WITHDRAWAL_IDEMPOTENCY_HEADER) idempotencyKey?: string,
  ) {
    return this.withdrawalService.createWithdrawal(
      request.user.id,
      request.user.accountRole,
      dto,
      this.normalizeIdempotencyKey(idempotencyKey),
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List my withdrawals',
    description: 'Paginated withdrawal history of the authenticated account',
  })
  @ApiOkResponse({ description: 'A page of withdrawals' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  async findAll(
    @Request() request: { user: AuthenticatedAccount },
    @Query() query: WithdrawalFilterDto,
  ) {
    return this.withdrawalService.findAll(request.user.id, query);
  }

  // Chuỗi rỗng coi như không gửi; quá dài thì vỡ varchar(128) nên chặn trước.
  private normalizeIdempotencyKey(raw?: string): string | undefined {
    const key = raw?.trim();
    if (!key) {
      return undefined;
    }
    if (key.length > MAX_WITHDRAWAL_IDEMPOTENCY_KEY_LENGTH) {
      throw new BadRequestException(
        `${WITHDRAWAL_IDEMPOTENCY_HEADER} must be at most ${MAX_WITHDRAWAL_IDEMPOTENCY_KEY_LENGTH} characters`,
      );
    }
    return key;
  }
}
