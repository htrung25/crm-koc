import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
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
import { BrandListService } from './brand-list.service';
import { AccountFilterItemDto } from './dto/account-filter-item.dto';
import { ApiFilterResponse } from '../../common/dto/filter-response.dto';
import { BrandFilterDto, BrandListResponseDto } from './dto/brand-list.dto';
import { IpWhitelistGuard } from './ip-whitelist.guard';

@ApiTags('Admin-UserList')
@ApiBearerAuth('access-token')
// Thứ tự guard có ý nghĩa: JwtAuthGuard chạy trước để nạp request.user,
// RolesGuard mới có cái để đọc.
@UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
@Roles(ERole.ADMIN)
@Controller('admin')
export class BrandListController {
  constructor(private readonly brandListService: BrandListService) {}

  @Get('/brands-list')
  @ApiOperation({ summary: 'List brand accounts, paginated' })
  @ApiFilterResponse(AccountFilterItemDto)
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  async findAll(@Query() query: BrandFilterDto) {
    return this.brandListService.findAll(query);
  }

  @Get('/brands-list/:id')
  @ApiOperation({ summary: 'Brand account details' })
  @ApiOkResponse({ type: BrandListResponseDto })
  @ApiBadRequestResponse({ description: 'Account exists but is not a brand' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandListService.findBrandById(id);
  }

  // Đường dẫn có 3 đoạn nên không tranh chấp với DELETE /admin/:id (xoá tài khoản admin).
  @Delete('/brands-list/:id')
  @ApiOperation({ summary: 'Delete a brand profile' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  @ApiNotFoundResponse({ description: 'Brand profile not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandListService.remove(id);
  }
}
