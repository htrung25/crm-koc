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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { ERole } from '../../common/enum/roles.enum';
import { AuthenticatedAccount } from '../auth/entities/authenticated.entity';
import { AdminProfileService } from './admin-profile.service';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { AdminProfileResponseDto } from './dto/admin-profile-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { IpWhitelistGuard } from './ip-whitelist.guard';

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
  @ApiOperation({
    summary: 'Change your own password. Revokes every session of this account',
  })
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
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.profileService.changePassword(request.user.id, dto);
  }
}
