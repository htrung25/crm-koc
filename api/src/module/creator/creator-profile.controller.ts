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
import { CreatorProfileService } from './creator-profile.service';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import { CreatorProfileResponseDto } from './dto/creator-profile-response.dto';
import { ChangePasswordDto } from '../../common/dto/change-password.dto';
import type { RequestWithToken } from '../../passport/jwt.strategy';

@ApiTags('Creator-Profile')
@ApiBearerAuth('access-token')
@Roles(ERole.CREATOR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('creator/profile')
export class CreatorProfileController {
  constructor(private readonly creatorProfileService: CreatorProfileService) {}

  @Get('/me')
  @ApiOperation({ summary: 'Your own creator profile' })
  @ApiOkResponse({ type: CreatorProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a creator account' })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  async getMe(
    @Request() request: { user: AuthenticatedAccount },
  ): Promise<CreatorProfileResponseDto> {
    const profile = await this.creatorProfileService.findByAccountId(
      request.user.id,
    );
    if (!profile) {
      throw new NotFoundException('profile not found');
    }
    return profile;
  }

  @Patch('/me')
  @ApiOperation({ summary: 'Partially update your own creator profile' })
  @ApiOkResponse({ type: CreatorProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a creator account' })
  @ApiNotFoundResponse({ description: 'Account has no profile yet' })
  @ApiConflictResponse({ description: 'Email already taken' })
  async updateMe(
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: UpdateCreatorProfileDto,
  ): Promise<CreatorProfileResponseDto> {
    return this.creatorProfileService.update(request.user.id, dto);
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
  @ApiForbiddenResponse({ description: 'Not a creator account' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts' })
  async changePassword(
    @Request() request: RequestWithToken & { user: AuthenticatedAccount },
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // session_id lấy từ token, không nhận từ body.
    return this.creatorProfileService.changePassword(
      request.user.id,
      dto,
      request.tokenPayload?.session_id,
    );
  }
}
