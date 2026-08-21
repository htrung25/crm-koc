import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
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
  CreateCollaborationDto,
  UpdateCollaborationStatusDto,
} from './dto/collaboration.dto';
import { CollaborationActor } from './types/collaboration.types';

@ApiTags('Collaboration')
@ApiBearerAuth('access-token')
@Roles(ERole.BRAND)
// JwtAuthGuard chạy trước để nạp request.user, RolesGuard mới có cái để đọc.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('brand/collaborations')
export class BrandCollaborationController {
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
    // Phạm vi lấy từ token, không nhận từ query: nhận từ query là đọc được
    // giá đã chốt của brand khác.
    return this.collaborationService.findAll(this.actor(request.user), query);
  }

  @Post()
  @ApiOperation({ summary: 'Start a collaboration with a creator' })
  @ApiCreatedResponse({ type: CollaborationDto })
  @ApiBadRequestResponse({
    description:
      'Malformed body, creator is your own account, or creator is not active',
  })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  @ApiNotFoundResponse({ description: 'Brand or creator profile not found' })
  @ApiConflictResponse({
    description: 'An open collaboration with this creator already exists',
  })
  async create(
    @Request() request: { user: AuthenticatedAccount },
    @Body() dto: CreateCollaborationDto,
  ) {
    // brandId lấy từ token: nhận từ body là tạo hợp tác hộ brand khác.
    return this.collaborationService.create(request.user.id, dto);
  }

  @Patch('/:id/status')
  @ApiOperation({
    summary: 'Move a collaboration to the next status',
    description:
      'Brand duyệt bài (submitted -> completed), trả bài về (submitted -> ' +
      'active), huỷ, hoặc mở tranh chấp. Nhận việc và nộp bài là quyền creator.',
  })
  @ApiOkResponse({ type: CollaborationDto })
  @ApiBadRequestResponse({ description: 'Transition is not allowed' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({
    description:
      'Not a brand account, or this transition belongs to the other party',
  })
  @ApiNotFoundResponse({
    description: 'Collaboration not found, or not yours',
  })
  @ApiConflictResponse({
    description: 'Someone else changed the status first',
  })
  async updateStatus(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollaborationStatusDto,
  ) {
    return this.collaborationService.updateStatus(
      this.actor(request.user),
      id,
      dto.status,
    );
  }

  /** Vai trò lấy từ guard của controller, không đọc lại accountRole trên token. */
  private actor(user: AuthenticatedAccount): CollaborationActor {
    return { id: user.id, role: ERole.BRAND };
  }
}
