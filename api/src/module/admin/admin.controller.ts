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
import { AdminService } from './admin.service';
import { AccountFilterResponseDto } from './dto/account-filters-response.dto';
import { AdminFilters } from './dto/admin-filters.dto';
import { BrandFilterDto } from './dto/brand-filters.dto';
import { CreatorFilterDto } from './dto/creator-filters.dto';
import {
  AdminFilterResponseDto,
  AdminResponseDto,
} from './dto/admin-response.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AddIpWhitelistDto } from './dto/add-ip-whitelist.dto';
import { RemoveIpWhitelistDto } from './dto/remove-ip-whitelist.dto';
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ERole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/admin-list')
  @UseGuards(IpWhitelistGuard)
  @ApiOperation({ summary: 'List admin accounts, paginated' })
  @ApiOkResponse({ type: AdminFilterResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  findAll(@Query() query: AdminFilters) {
    return this.adminService.findAll(query);
  }

  @Get('/brands-list')
  @UseGuards(IpWhitelistGuard)
  @ApiOperation({ summary: 'List brand accounts, paginated' })
  @ApiOkResponse({ type: AccountFilterResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  findAllBrands(@Query() query: BrandFilterDto) {
    return this.adminService.findAllBrands(query);
  }

  @Get('/creators-list')
  @UseGuards(IpWhitelistGuard)
  @ApiOperation({ summary: 'List creator accounts, paginated' })
  @ApiOkResponse({ type: AccountFilterResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  findAllCreators(@Query() query: CreatorFilterDto) {
    return this.adminService.findAllCreators(query);
  }

  // Đặt SAU /brands và /creators: '/:id/status' là route động, nếu khai
  // trước thì Nest sẽ khớp '/brands' vào :id và ParseUUIDPipe ném 400.
  @Patch('/:id/status')
  @UseGuards(IpWhitelistGuard)
  @ApiOperation({
    summary: 'Change account status; banning takes effect immediately',
  })
  @ApiOkResponse({ type: AdminResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.adminService.updateStatus(id, dto);
  }
  /**
   * PHẢI khai sau /admin-list, /brands-list, /creators-list: cùng method GET và
   * cùng một đoạn đường dẫn, nên đặt trước thì '/admin-list' sẽ khớp vào :id và
   * ParseUUIDPipe ném 400.
   */
  @Get('/:id')
  @UseGuards(IpWhitelistGuard)
  @ApiOperation({ summary: 'Read one admin account with its IP whitelist' })
  @ApiOkResponse({ type: AdminResponseDto })
  @ApiBadRequestResponse({ description: 'Account exists but is not an admin' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  findAdminById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.findAdminById(id);
  }

  /**
   * Đặt lại TOÀN BỘ whitelist, đối xứng với DELETE cùng đường dẫn.
   *
   * Không dùng '/:id' trơn: đường dẫn đó đọc ra là "sửa tài khoản admin",
   * trong khi body chỉ nhận mỗi whitelist. Giữ '/:id' trống để dành cho việc
   * sửa hồ sơ admin thật sự sau này.
   */
  @Patch('/:id/ip-whitelist')
  @UseGuards(IpWhitelistGuard, SuperAdminGuard)
  @ApiOperation({
    summary: 'Replace the whole IP whitelist CSV of an admin. Super admin only',
  })
  @ApiOkResponse({ type: AdminResponseDto })
  @ApiBadRequestResponse({
    description: 'Malformed IP or CIDR; businessCode says which kind',
  })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({
    description: 'Requires super admin role, or IP not whitelisted',
  })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiUnprocessableEntityResponse({
    description:
      'Change would lock the caller out of their own whitelist; set acknowledgeSelfLockout to override',
  })
  updateAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddIpWhitelistDto,
    @Request() request: ExpressRequest & { user: AuthenticatedAccount },
  ) {
    // clientIp lấy từ request chứ không nhận từ body: để client tự khai IP của
    // mình thì bất biến chống tự khoá thành vô nghĩa.
    return this.adminService.updateIpWhitelist(id, dto, {
      accountId: request.user.id,
      clientIp: extractClientIp(request),
    });
  }

  /**
   * Xoá MỘT phần tử khỏi whitelist, thay cho việc gửi lại cả chuỗi.
   *
   * '/:id/ip-whitelist' lệch số đoạn với '/:id' nên hai route không tranh nhau.
   * Đừng rút gọn thành '/:id': đường dẫn đó đọc ra là "xoá tài khoản admin"
   * trong khi việc thật chỉ là gỡ một IP, và nó chiếm luôn chỗ của endpoint
   * xoá admin sau này.
   */
  @Delete('/:id/ip-whitelist')
  @UseGuards(IpWhitelistGuard, SuperAdminGuard)
  @ApiOperation({
    summary: 'Remove one IP/CIDR from an admin IP whitelist. Super admin only',
  })
  @ApiOkResponse({ type: AdminResponseDto })
  @ApiBadRequestResponse({
    description: 'Malformed IP or CIDR, or account is not an admin',
  })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({
    description: 'Requires super admin role, or IP not whitelisted',
  })
  @ApiNotFoundResponse({
    description: 'Account not found, or entry not in the whitelist',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Removing this entry would lock the caller out; set acknowledgeSelfLockout to override',
  })
  async removeIpWhitelistEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RemoveIpWhitelistDto,
    @Request() request: ExpressRequest & { user: AuthenticatedAccount },
  ) {
    return this.adminService.removeIpWhitelistEntry(
      id,
      query.entry.trim(),
      {
        accountId: request.user.id,
        clientIp: extractClientIp(request),
      },
      query.acknowledgeSelfLockout === true,
    );
  }
}
