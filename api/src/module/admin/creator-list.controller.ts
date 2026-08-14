import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { CreatorListService } from './creator-list.service';
import { AccountFilterResponseDto } from './dto/account-filters-response.dto';
import { CreatorFilterDto } from './dto/creator-filters.dto';
import { IpWhitelistGuard } from './ip-whitelist.guard';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
// Thứ tự guard có ý nghĩa: JwtAuthGuard chạy trước để nạp request.user,
// RolesGuard mới có cái để đọc.
@UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
@Roles(ERole.ADMIN)
@Controller('admin')
export class CreatorListController {
  constructor(private readonly creatorListService: CreatorListService) {}

  @Get('/creators-list')
  @ApiOperation({ summary: 'List creator accounts, paginated' })
  @ApiOkResponse({ type: AccountFilterResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  findAll(@Query() query: CreatorFilterDto) {
    return this.creatorListService.findAll(query);
  }
}
