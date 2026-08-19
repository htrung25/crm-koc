import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { AuthThrottle } from '../../security/auth-throttle.decorator';
import { ERole } from '../../common/enum/roles.enum';
import { ESocialPlatform } from '../../common/enum/social-platform.enum';
import { AuthenticatedAccount } from '../auth/entities/authenticated.entity';
import { SocialConnectionsService } from './connection.service';
import { SocialOAuthCallbackDto } from './dto/oauth-callback.dto';
import { SocialConnectionDto } from './dto/connection.dto';

/**
 * Chỉ creator nối tài khoản mạng xã hội — brand và admin không có
 * creator_profiles nên khoá ngoại sẽ hỏng.
 *
 * Callback là POST và CÓ xác thực, không phải GET công khai: nền tảng chuyển
 * hướng trình duyệt về trang frontend, trang đó đọc cookie phiên rồi mới gọi
 * endpoint này kèm bearer token. Nhờ vậy so được người đang đăng nhập với
 * creatorProfileId đã cất trong state.
 */
@ApiTags('Social-Connections')
@ApiBearerAuth('access-token')
@Roles(ERole.CREATOR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('social')
export class SocialConnectionsController {
  constructor(private readonly connectionsService: SocialConnectionsService) {}

  @Get('/connections')
  @ApiOperation({ summary: 'Danh sách tài khoản mạng xã hội đã kết nối' })
  @ApiOkResponse({ type: [SocialConnectionDto] })
  @ApiUnauthorizedResponse({ description: 'Token thiếu, sai hoặc hết hạn' })
  @ApiForbiddenResponse({ description: 'Không phải tài khoản creator' })
  async list(
    @Request() request: { user: AuthenticatedAccount },
  ): Promise<SocialConnectionDto[]> {
    // Service đã lọc cột bằng select nên trả thẳng, không map lại.
    return this.connectionsService.findByCreator(request.user.id);
  }

  // Mỗi lần gọi là một state mới nằm trong Redis 10 phút; không giới hạn thì
  // gọi liên tục sẽ rác Redis.
  @AuthThrottle()
  @Get('/:platform/authorize')
  @ApiOperation({ summary: 'Lấy URL chuyển hướng để bắt đầu luồng OAuth' })
  @ApiParam({ name: 'platform', enum: ESocialPlatform })
  @ApiOkResponse({
    schema: { properties: { authorizationUrl: { type: 'string' } } },
  })
  @ApiUnauthorizedResponse({ description: 'Token thiếu, sai hoặc hết hạn' })
  @ApiForbiddenResponse({ description: 'Không phải tài khoản creator' })
  authorize(
    @Request() request: { user: AuthenticatedAccount },
    @Param('platform', new ParseEnumPipe(ESocialPlatform))
    platform: ESocialPlatform,
  ): Promise<{ authorizationUrl: string }> {
    return this.connectionsService.createAuthorizationUrl({
      creatorProfileId: request.user.id,
      platform,
    });
  }

  @AuthThrottle()
  @Post('/:platform/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hoàn tất luồng OAuth và lưu kết nối' })
  @ApiParam({ name: 'platform', enum: ESocialPlatform })
  @ApiOkResponse({ type: SocialConnectionDto })
  @ApiUnauthorizedResponse({
    description: 'State hết hạn, sai, hoặc token hỏng',
  })
  @ApiForbiddenResponse({
    description: 'State thuộc về creator khác, hoặc không phải creator',
  })
  @ApiConflictResponse({
    description: 'Tài khoản mạng xã hội này đã thuộc creator khác',
  })
  async callback(
    @Request() request: { user: AuthenticatedAccount },
    @Param('platform', new ParseEnumPipe(ESocialPlatform))
    platform: ESocialPlatform,
    @Body() dto: SocialOAuthCallbackDto,
  ): Promise<SocialConnectionDto> {
    return this.connectionsService.handleCallback({
      platform,
      code: dto.code,
      state: dto.state,
      currentAccountId: request.user.id,
    });
  }

  @Delete('/connections/:platform')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Ngắt kết nối một nền tảng' })
  @ApiParam({ name: 'platform', enum: ESocialPlatform })
  @ApiNoContentResponse({ description: 'Đã ngắt kết nối' })
  @ApiUnauthorizedResponse({ description: 'Token thiếu, sai hoặc hết hạn' })
  @ApiForbiddenResponse({ description: 'Không phải tài khoản creator' })
  disconnect(
    @Request() request: { user: AuthenticatedAccount },
    @Param('platform', new ParseEnumPipe(ESocialPlatform))
    platform: ESocialPlatform,
  ): Promise<void> {
    return this.connectionsService.disconnect(request.user.id, platform);
  }
}
