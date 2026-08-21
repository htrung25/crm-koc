import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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
  CollaborationDto,
  CollaborationFilterDto,
  UpdateCollaborationStatusDto,
} from './dto/collaboration.dto';
import { CollaborationActor } from './types/collaboration.types';

@ApiTags('Creator-Collaboration')
@ApiBearerAuth('access-token')
@Roles(ERole.CREATOR)
// JwtAuthGuard chạy trước để nạp request.user, RolesGuard mới có cái để đọc.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('creator/collaborations')
export class CreatorCollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Get()
  @ApiOperation({ summary: 'List collaborations you were invited to' })
  @ApiFilterResponse(CollaborationDto)
  @ApiBadRequestResponse({ description: 'Malformed filter or sort value' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Not a creator account' })
  async findAll(
    @Request() request: { user: AuthenticatedAccount },
    @Query() query: CollaborationFilterDto,
  ) {
    // Lọc theo creatorId lấy từ token: nhận từ query là đọc được hợp tác của
    // creator khác, kèm giá đã chốt.
    return this.collaborationService.findAll(this.actor(request.user), query);
  }

  @Patch('/:id/status')
  @ApiOperation({
    summary: 'Move a collaboration to the next status',
    description:
      'Creator nhận việc (pending -> active), nộp bài (active -> submitted), ' +
      'từ chối, huỷ, hoặc mở tranh chấp. Duyệt bài là quyền của brand.',
  })
  @ApiOkResponse({ type: CollaborationDto })
  @ApiBadRequestResponse({ description: 'Transition is not allowed' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({
    description:
      'Not a creator account, or this transition belongs to the other party',
  })
  @ApiNotFoundResponse({ description: 'Collaboration not found, or not yours' })
  @ApiConflictResponse({ description: 'Someone else changed the status first' })
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
    return { id: user.id, role: ERole.CREATOR };
  }
}
