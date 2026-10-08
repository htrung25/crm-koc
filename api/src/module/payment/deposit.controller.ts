import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { ERole } from '../../common/enum/roles.enum';
import type { AuthenticatedAccount } from '../auth/types/authenticated.types';
import { DepositService } from './deposit.service';
import { DepositDto } from './dto/deposit.dto';
import { DepositFilterDto } from './dto/deposit-filter.dto';

@ApiTags('Deposits')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.CREATOR, ERole.BRAND)
@Controller('payment/deposits')
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post('sepay')
  @ApiOperation({
    summary: 'Create a bank transfer deposit (SePay QR)',
    description:
      'Returns a VietQR image URL and the transfer content. The wallet is ' +
      'credited automatically when SePay reports the transfer; poll ' +
      'GET /payment/deposits/:id for the status.',
  })
  @ApiCreatedResponse({ description: 'Deposit created, status pending' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a creator or brand account' })
  @ApiServiceUnavailableResponse({
    description: 'Bank transfer deposit is not configured on the server',
  })
  async createSepay(
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: DepositDto,
  ) {
    return this.depositService.createSepayDeposit(
      request.user.id,
      request.user.accountRole,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List my deposits' })
  @ApiOkResponse({ description: 'A page of deposits, newest first' })
  async findAll(
    @Request() request: { user: AuthenticatedAccount },
    @Query() query: DepositFilterDto,
  ) {
    return this.depositService.findAll(request.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my deposits with its QR' })
  @ApiOkResponse({ description: 'Deposit with QR and transfer content' })
  @ApiNotFoundResponse({ description: 'Deposit does not exist' })
  async findOne(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.depositService.findOne(request.user.id, id);
  }
}
