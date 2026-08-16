import {
  Body,
  Controller,
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
import { AdminProfileService } from './admin-profile.service';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { AdminProfileResponseDto } from './dto/admin-profile-response.dto';
import { ChangePasswordDto } from '../../common/dto/change-password.dto';
import { IpWhitelistGuard } from './ip-whitelist.guard';
import type { RequestWithToken } from '../../passport/jwt.strategy';

/**
 * IpWhitelistGuard đặt ở cấp class nên áp cho CẢ đọc lẫn ghi. Trước đó chỉ
 * nhánh ghi có guard, nghĩa là admin từ IP ngoài danh sách vẫn đọc được hồ sơ.
 */
@ApiTags('Admin-Profile')
@ApiBearerAuth('access-token')
@Roles(ERole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
@Controller('admin/profile')
export class AdminProfileController {
  constructor(private readonly profileService: AdminProfileService) {}

  @Get('/me')
  @ApiOperation({ summary: 'Your own admin profile' })
  @ApiOkResponse({ type: AdminProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not an admin, or IP not whitelisted' })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  async getMe(
    @Request() request: { user: AuthenticatedAccount },
  ): Promise<AdminProfileResponseDto> {
    const profile = await this.profileService.findByAccountId(request.user.id);
    if (!profile) {
      throw new NotFoundException('profile not found');
    }
    return AdminProfileResponseDto.from(profile);
  }

  @Patch('/me')
  @ApiOperation({ summary: 'Partially update your own admin profile' })
  @ApiOkResponse({ type: AdminProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not an admin, or IP not whitelisted' })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  @ApiConflictResponse({ description: 'Email already taken' })
  async updateMe(
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: UpdateAdminProfileDto,
  ): Promise<AdminProfileResponseDto> {
    return AdminProfileResponseDto.from(
      await this.profileService.update(request.user.id, dto),
    );
  }

  @Patch('/me/change-password')
  @HttpCode(HttpStatus.OK)
  // ACCOUNT_AND_IP chứ không phải ACCOUNT: oldPassword là bề mặt dò mật khẩu,
  // token bị lộ thì kẻ tấn công không được dùng chung hạn mức từ nhiều máy.
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
  @ApiTooManyRequestsResponse({ description: 'Too many attempts' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @ApiBadRequestResponse({
    description: 'New password is weak, or same as the current one',
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid, or current password is incorrect',
  })
  @ApiForbiddenResponse({ description: 'Not an admin, or IP not whitelisted' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  async changePassword(
    @Request() request: RequestWithToken & { user: AuthenticatedAccount },
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // session_id lấy từ token đã xác thực, không nhận từ body: để client tự
    // khai thì kẻ tấn công giữ được phiên của mình khi đổi mật khẩu nạn nhân.
    return this.profileService.changePassword(
      request.user.id,
      dto,
      request.tokenPayload?.session_id,
    );
  }
}
