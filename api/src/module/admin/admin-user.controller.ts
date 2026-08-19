import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Delete,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { AdminService } from './admin-user.service';
import { AdminFilterDto, AdminUserDto } from './dto/admin-user.dto';
import { ApiFilterResponse } from '../../common/dto/filter-response.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { IpWhitelistGuard } from './ip-whitelist.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { extractClientIp } from '../../common/util/ip.util';
import { AuthenticatedAccount } from '../auth/entities/authenticated.entity';
// import type: isolatedModules + emitDecoratorMetadata cấm type thường trong
// chữ ký đã decorate
import type { Request as ExpressRequest } from 'express';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
// Thứ tự guard có ý nghĩa: JwtAuthGuard chạy trước để nạp request.user,
// RolesGuard mới có cái để đọc. Đảo lại thì RolesGuard luôn thấy user rỗng.
@UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
@Roles(ERole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/admin-list')
  @ApiOperation({ summary: 'List admin accounts, paginated' })
  @ApiFilterResponse(AdminUserDto)
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  findAll(@Query() query: AdminFilterDto) {
    return this.adminService.findAll(query);
  }

  // Route động phải khai sau mọi route tĩnh, nếu không '/admin-list' sẽ khớp
  // vào :id và ParseUUIDPipe ném 400.
  @Patch('/:id/status')
  @ApiOperation({
    summary: 'Change account status; banning takes effect immediately',
  })
  @ApiOkResponse({ type: AdminUserDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminService.updateStatus(id, dto);
  }
  /**
   * Chi tiết một tài khoản admin.
   */
  @Get('/:id')
  @ApiOperation({ summary: 'Read one admin account in detail' })
  @ApiOkResponse({ type: AdminUserDto })
  @ApiBadRequestResponse({ description: 'Account exists but is not an admin' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findAdminById(id);
  }

  @Patch('/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Update one admin account. Super admin only',
  })
  @ApiOkResponse({ type: AdminUserDto })
  @ApiBadRequestResponse({
    description:
      'Malformed body, malformed IP/CIDR, or account is not an admin',
  })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({
    description: 'Requires super admin role, or IP not whitelisted',
  })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiConflictResponse({
    description: 'Email already belongs to another account',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Change would lock the caller out of their own whitelist; set acknowledgeSelfLockout to override',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
    @Request() request: ExpressRequest & { user: AuthenticatedAccount },
  ) {
    // clientIp lấy từ request chứ không nhận từ body: để client tự khai IP của
    // mình thì bất biến chống tự khoá thành vô nghĩa.
    return this.adminService.updateAdminById(id, dto, {
      accountId: request.user.id,
      clientIp: extractClientIp(request),
    });
  }

  @Delete('/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Delete one admin account. Super admin only',
  })
  @ApiOkResponse({ type: AdminUserDto })
  @ApiBadRequestResponse({
    description: 'Account exists but is not an admin',
  })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({
    description: 'Requires super admin role, or IP not whitelisted',
  })
  @ApiNotFoundResponse({
    description: 'Account not found',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteAdminById(id);
  }
}
