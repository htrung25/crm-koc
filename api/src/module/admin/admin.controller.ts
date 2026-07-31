import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EAccountRole } from '../../common/enum/account-roles.enum';
import { JwtAuthGuard } from '../../security/jwt.guard';
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

@ApiTags('Admin')
@ApiBearerAuth('access-token')
// Thứ tự guard có ý nghĩa: JwtAuthGuard chạy trước để nạp request.user,
// RolesGuard mới có cái để đọc. Đảo lại thì RolesGuard luôn thấy user rỗng.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(EAccountRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/admin-list')
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
}
