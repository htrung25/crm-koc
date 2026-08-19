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
import { CreatorListService } from './creator-list.service';
import { AccountFilterItemDto } from './dto/account-filter-item.dto';
import { ApiFilterResponse } from '../../common/dto/filter-response.dto';
import {
  CreatorFilterDto,
  CreatorListResponseDto,
} from './dto/creator-list.dto';
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
  @ApiFilterResponse(AccountFilterItemDto)
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  async findAll(@Query() query: CreatorFilterDto) {
    return this.creatorListService.findAll(query);
  }

  @Get('/creators-list/:id')
  @ApiOperation({ summary: 'Creator account details' })
  @ApiOkResponse({ type: CreatorListResponseDto })
  @ApiBadRequestResponse({ description: 'Account exists but is not a creator' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.creatorListService.findCreatorById(id);
  }

  // Đường dẫn có 3 đoạn nên không tranh chấp với DELETE /admin/:id (xoá tài khoản admin).
  @Delete('/creators-list/:id')
  @ApiOperation({ summary: 'Delete a creator profile' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  @ApiNotFoundResponse({ description: 'Creator profile not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.creatorListService.remove(id);
  }
}
