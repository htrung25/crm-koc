import {
  Body,
  Controller,
  Delete,
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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApiFilterResponse } from '../../common/dto/filter-response.dto';
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { AuthenticatedAccount } from '../auth/types/authenticated.types';
import { CollaborationService } from './collaboration.service';
import { CollaborationDto } from './dto/collaboration.dto';
import { CollaborationFilterDto } from './dto/collaboration-filter.dto';
import { UpdateCollaborationStatusDto } from './dto/update-collaboration-status.dto';
import { ProposePriceDto } from './dto/propose-price.dto';
import { CollaborationActor } from './types/collaboration.types';

@ApiTags('Collaboration')
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

  @Post('/:id/price-proposal')
  @ApiOperation({
    summary: 'Propose a new price while the collaboration is pending',
    description:
      'Không thấp hơn giá campaign. Đề xuất mới đè đề xuất cũ; brand chấp nhận thì giá mới có hiệu lực.',
  })
  @ApiOkResponse({ type: CollaborationDto })
  @ApiNotFoundResponse({ description: 'Collaboration not found, or not yours' })
  @ApiUnprocessableEntityResponse({
    description: 'Not pending, or price is below the campaign price',
  })
  async proposePrice(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProposePriceDto,
  ) {
    return this.collaborationService.proposePrice(
      this.actor(request.user),
      id,
      dto.price,
    );
  }

  @Post('/:id/price-proposal/accept')
  @ApiOperation({ summary: "Accept the brand's proposed price" })
  @ApiOkResponse({ type: CollaborationDto })
  @ApiNotFoundResponse({ description: 'Collaboration not found, or not yours' })
  @ApiUnprocessableEntityResponse({
    description:
      'No proposal, own proposal, or brand wallet cannot cover the difference',
  })
  async acceptPrice(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collaborationService.acceptPrice(this.actor(request.user), id);
  }

  @Delete('/:id/price-proposal')
  @ApiOperation({ summary: 'Withdraw or decline the open price proposal' })
  @ApiOkResponse({ type: CollaborationDto })
  @ApiNotFoundResponse({ description: 'Collaboration not found, or not yours' })
  async withdrawPrice(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collaborationService.withdrawPrice(
      this.actor(request.user),
      id,
    );
  }

  /** Vai trò lấy từ guard của controller, không đọc lại accountRole trên token. */
  private actor(user: AuthenticatedAccount): CollaborationActor {
    return { id: user.id, role: ERole.CREATOR };
  }
}
