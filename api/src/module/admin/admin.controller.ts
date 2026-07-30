import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { AdminService } from './admin.service';
import { AdminFilters } from './dto/admin-filters.dto';
import { AdminFilterResponseDto } from './dto/admin-response.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/list')
  @ApiOperation({ summary: 'List admin accounts, paginated' })
  @ApiOkResponse({ type: AdminFilterResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  findAll(@Query() query: AdminFilters) {
    return this.adminService.findAll(query);
  }
}
