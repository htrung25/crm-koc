import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EAccountRole } from '../../common/enum/account-roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { AdminService } from './admin.service';
import { AdminFilters } from './dto/admin-filters.dto';
import { AdminFilterResponseDto } from './dto/admin-response.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
// Thứ tự guard có ý nghĩa: JwtAuthGuard chạy trước để nạp request.user,
// RolesGuard mới có cái để đọc. Đảo lại thì RolesGuard luôn thấy user rỗng.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(EAccountRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/list')
  @ApiOperation({ summary: 'List admin accounts, paginated' })
  @ApiOkResponse({ type: AdminFilterResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  findAll(@Query() query: AdminFilters) {
    return this.adminService.findAll(query);
  }
}
