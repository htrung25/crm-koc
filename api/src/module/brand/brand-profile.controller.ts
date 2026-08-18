import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  AUTH_THROTTLE_BLOCK_MS,
  AUTH_THROTTLE_LIMIT,
  AUTH_THROTTLE_TTL_MS,
} from '../../security/auth-throttle.decorator';
import { ThrottleKey } from '../../security/throttle-key.decorator';
import { EThrottleKeyMode } from '../../common/enum/throttle-key-modes.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { ERole } from '../../common/enum/roles.enum';
import { AuthenticatedAccount } from '../auth/entities/authenticated.entity';
import { BrandProfileService } from './brand-profile.service';
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto';
import { BrandProfileResponseDto } from './dto/brand-profile-response.dto';
import { ChangePasswordDto } from '../../common/dto/change-password.dto';
import type { RequestWithToken } from '../../passport/jwt.strategy';

@ApiTags('Brand-Profile')
@ApiBearerAuth('access-token')
@Roles(ERole.BRAND)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('brand/profile')
export class BrandProfileController {
  constructor(private readonly brandProfileService: BrandProfileService) {}

  @Get('/me')
  @ApiOperation({ summary: 'Your own brand profile' })
  @ApiOkResponse({ type: BrandProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  async getMe(
    @Request() request: { user: AuthenticatedAccount },
  ): Promise<BrandProfileResponseDto> {
    const profile = await this.brandProfileService.findByAccountId(
      request.user.id,
    );
    if (!profile) {
      throw new NotFoundException('profile not found');
    }
    return profile;
  }

  @Patch('/me')
  @ApiOperation({ summary: 'Partially update your own brand profile' })
  @ApiOkResponse({ type: BrandProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  @ApiConflictResponse({ description: 'Email or tax code already taken' })
  async updateMe(
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: UpdateBrandProfileDto,
  ): Promise<BrandProfileResponseDto> {
    return this.brandProfileService.update(request.user.id, dto);
  }

  @Patch('/me/change-password')
  @HttpCode(HttpStatus.OK)
  // ACCOUNT_AND_IP: oldPassword là bề mặt dò mật khẩu, token bị lộ thì không
  // được dùng chung hạn mức từ nhiều máy.
  @Throttle({
    default: {
      limit: AUTH_THROTTLE_LIMIT,
      ttl: AUTH_THROTTLE_TTL_MS,
      blockDuration: AUTH_THROTTLE_BLOCK_MS,
    },
  })
  @ThrottleKey(EThrottleKeyMode.ACCOUNT_AND_IP)
  @ApiOperation({
    summary:
      'Change your own password. Revokes every OTHER session, keeps this one',
  })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @ApiBadRequestResponse({
    description: 'New password is weak, or same as the current one',
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid, or current password is incorrect',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts' })
  async changePassword(
    @Request() request: RequestWithToken & { user: AuthenticatedAccount },
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // session_id lấy từ token, không nhận từ body.
    return this.brandProfileService.changePassword(
      request.user.id,
      dto,
      request.tokenPayload?.session_id,
    );
  }

  @Delete('/me')
  @ApiOperation({ summary: 'Delete your own brand account. Irreversible' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiConflictResponse({ description: 'Account still has collaborations' })
  async deleteMe(
    @Request() request: { user: AuthenticatedAccount },
  ): Promise<{ message: string }> {
    return this.brandProfileService.remove(request.user.id);
  }
}
