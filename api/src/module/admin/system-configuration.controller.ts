import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { AuthenticatedAccount } from '../auth/types/authenticated.types';
import {
  SystemConfigurationDto,
  UpdateSystemConfigurationsDto,
} from './dto/system-configuration.dto';
import { IpWhitelistGuard } from './ip-whitelist.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { SystemConfigurationService } from './system-configuration.service';

@ApiTags('Admin-SystemConfiguration')
@ApiBearerAuth('access-token')
// Thứ tự guard có ý nghĩa: JwtAuthGuard chạy trước để nạp request.user,
// RolesGuard mới có cái để đọc.
@UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
@Roles(ERole.ADMIN)
@Controller('admin/system-config')
export class SystemConfigurationController {
  constructor(
    private readonly systemConfigurationService: SystemConfigurationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List every system configuration' })
  @ApiOkResponse({ type: [SystemConfigurationDto] })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  async findAll(): Promise<SystemConfigurationDto[]> {
    // Entity trùng khít DTO nên trả thẳng, không map lại.
    return this.systemConfigurationService.findAll();
  }

  @Patch()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Update one or more configurations. Super admin only',
    description:
      'Validate toàn bộ trước rồi mới ghi: một giá trị sai thì không giá trị ' +
      'nào được ghi. Chỉ sửa được value, không sửa được type hay group.',
  })
  @ApiOkResponse({ type: [SystemConfigurationDto] })
  @ApiBadRequestResponse({
    description: 'Duplicated keys, or a value does not match its stored type',
  })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({
    description: 'Requires super admin role, or IP not whitelisted',
  })
  @ApiNotFoundResponse({ description: 'One or more keys do not exist' })
  async updateMany(
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: UpdateSystemConfigurationsDto,
  ): Promise<SystemConfigurationDto[]> {
    // actorId lấy từ token, không nhận từ body.
    return this.systemConfigurationService.updateMany(
      dto.items,
      request.user.id,
    );
  }
}
