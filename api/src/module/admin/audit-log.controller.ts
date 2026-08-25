import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiFilterResponse } from '../../common/dto/filter-response.dto';
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { Roles } from '../../security/roles.decorator';
import { RolesGuard } from '../../security/roles.guard';
import { AuditLogService } from './audit-log.service';
import { AuditLogFilterDto, AuditLogListItemDto } from './dto/audit-log.dto';
import { IpWhitelistGuard } from './ip-whitelist.guard';
import { SuperAdminGuard } from './super-admin.guard';

@ApiTags('Admin-AuditLog')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard, SuperAdminGuard)
@Roles(ERole.ADMIN)
@Controller('admin')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('/audit-logs')
  @ApiOperation({ summary: 'List and search audit logs, paginated' })
  @ApiFilterResponse(AuditLogListItemDto)
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({
    description: 'Requires a whitelisted super-admin account',
  })
  async findAll(@Query() query: AuditLogFilterDto) {
    return query.search?.trim()
      ? this.auditLogService.search(query)
      : this.auditLogService.findAll(query);
  }
}
