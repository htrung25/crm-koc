import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiFilterResponse } from '../../common/dto/filter-response.dto';
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { AuthenticatedAccount } from '../auth/entities/authenticated.entity';
import { CollaborationService } from './collaboration.service';
import {
  CollaborationFilterDto,
  CollaborationDto,
} from './dto/collaboration.dto';

@ApiTags('Brand-Collaboration')
@ApiBearerAuth('access-token')
@Roles(ERole.BRAND)
// JwtAuthGuard chạy trước để nạp request.user, RolesGuard mới có cái để đọc.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('brand/collaborations')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Get()
  @ApiOperation({ summary: 'List your own collaborations, paginated' })
  @ApiFilterResponse(CollaborationDto)
  @ApiBadRequestResponse({ description: 'Malformed filter or sort value' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  async findAll(
    @Request() request: { user: AuthenticatedAccount },
    @Query() query: CollaborationFilterDto,
  ) {
    // brandId lấy từ token, không nhận từ query: nhận từ query là đọc được
    // giá đã chốt của brand khác.
    return this.collaborationService.findAll(request.user.id, query);
  }
}
