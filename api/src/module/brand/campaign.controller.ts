import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
// Đường dẫn tương đối, KHÔNG dùng 'src/...': nest build có rewrite nên dist vẫn
// chạy, nhưng check-routes.js nạp thẳng src qua ts-node và sẽ không phân giải được.
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { Roles } from '../../security/roles.decorator';
import { RolesGuard } from '../../security/roles.guard';
import { AuthenticatedAccount } from '../auth/types/authenticated.types';
import { CampaignService } from './campaign.service';
import type { CampaignDetail } from './campaign.service';
import { CampaignSubmitService } from './campaign-submit.service';
import {
  CAMPAIGN_IDEMPOTENCY_HEADER,
  MAX_IDEMPOTENCY_KEY_LENGTH,
} from './constants/campaign.constants';
import { CampaignCreatedResponseDto } from './dto/campaign-response.dto';
import {
  CampaignSubmittedResponseDto,
  SubmitCampaignDto,
} from './dto/submit-campaign.dto';
import { SyncDeliverablesDto } from './dto/sync-deliverables.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Campaign } from './entities/campaign.entity';
import { CampaignDeliverable } from './entities/campaign-deliverable.entity';

@ApiTags('Brand-Campaign')
@ApiBearerAuth('access-token')
@Roles(ERole.BRAND)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('brand/campaigns')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly submitService: CampaignSubmitService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create an empty campaign in draft state',
    description:
      'Takes no business data: returns the id for the autosave wizard to ' +
      'write into. Replaying the same Idempotency-Key returns the campaign ' +
      'created before instead of a second draft.',
  })
  @ApiHeader({
    name: CAMPAIGN_IDEMPOTENCY_HEADER,
    required: false,
    description: 'Client-generated string, uuid recommended. Lives 24 hours.',
  })
  @ApiCreatedResponse({ type: CampaignCreatedResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired token',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  @ApiUnprocessableEntityResponse({
    description: 'Unfinished campaign limit reached',
  })
  async create(
    @Request() request: { user: AuthenticatedAccount },
    @Headers(CAMPAIGN_IDEMPOTENCY_HEADER) idempotencyKey?: string,
  ): Promise<CampaignCreatedResponseDto> {
    const key = this.normalizeIdempotencyKey(idempotencyKey);
    const campaign = await this.campaignService.createCampaign(
      request.user.id,
      key,
    );

    // Entity thừa cột so với hợp đồng endpoint nên bóc tay đúng phần cần trả.
    return {
      id: campaign.id,
      code: campaign.code,
      status: campaign.status,
      version: campaign.version,
      wizardStep: campaign.wizardStep,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Reopen a campaign with its deliverables',
    description:
      'Returns wizardStep so the client can jump back to the step in ' +
      'progress, and version to send along with the next write.',
  })
  @ApiOkResponse({ description: 'Campaign and its deliverable list' })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired token',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  @ApiNotFoundResponse({ description: 'Campaign does not exist' })
  async findOne(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CampaignDetail> {
    return this.campaignService.findDetail(request.user.id, id);
  }

  // FE nên debounce khoảng 2 giây; giới hạn này chỉ là lưới an toàn cho trường
  // hợp gõ tới đâu bắn request tới đó.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Patch(':id')
  @ApiOperation({
    summary: 'Autosave a draft',
    description:
      'Absent field: left untouched. Field set to null: clears the previous ' +
      'value. Only wrong type, too long and invalid enum are rejected — ' +
      'missing data is normal for a draft. cashBudget is computed by the ' +
      'server and is rejected if sent.',
  })
  @ApiQuery({
    name: 'expectedVersion',
    type: Number,
    description: 'Version the client holds, to guard against lost updates',
  })
  @ApiOkResponse({ type: Campaign })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired token',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  @ApiNotFoundResponse({ description: 'Campaign does not exist' })
  @ApiConflictResponse({ description: 'Version has changed' })
  @ApiUnprocessableEntityResponse({
    description: 'Campaign is in a state that cannot be edited',
  })
  async update(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
    @Query('expectedVersion') expectedVersion: string,
    @Body() dto: UpdateCampaignDto,
  ): Promise<Campaign> {
    return this.campaignService.updateDraft(
      request.user.id,
      id,
      this.parseExpectedVersion(expectedVersion),
      dto,
    );
  }

  @Put(':id/deliverables')
  @ApiOperation({
    summary: 'Sync the whole deliverable list',
    description:
      'Send the current state of step 3, not a sequence of operations. A ' +
      'row with an id is updated, without an id is inserted, and absent ' +
      'from the array is DELETED. position is assigned by the server from ' +
      'the element order.',
  })
  @ApiOkResponse({ type: [CampaignDeliverable] })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired token',
  })
  @ApiForbiddenResponse({ description: 'Not a brand account' })
  @ApiNotFoundResponse({ description: 'Campaign does not exist' })
  @ApiConflictResponse({ description: 'Version has changed' })
  @ApiUnprocessableEntityResponse({
    description: 'Campaign is in a state that cannot be edited',
  })
  async putDeliverables(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SyncDeliverablesDto,
  ): Promise<CampaignDeliverable[]> {
    return this.campaignService.syncDeliverables(
      request.user.id,
      id,
      dto.expectedVersion,
      dto.deliverables,
    );
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Submit a campaign for admin review',
    description:
      'Freezes an immutable snapshot and moves to PENDING_APPROVAL. On ' +
      'missing data it returns 422 with errors[] and the campaign keeps ' +
      'its current state.',
  })
  @ApiOkResponse({ type: CampaignSubmittedResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired token',
  })
  @ApiForbiddenResponse({
    description:
      'Brand is not VERIFIED, or was rejected with a reason that bars resubmit',
  })
  @ApiNotFoundResponse({ description: 'Campaign does not exist' })
  @ApiConflictResponse({ description: 'Version has changed' })
  @ApiUnprocessableEntityResponse({
    description: 'Data is not ready for review, or wrong state',
  })
  async submit(
    @Request() request: { user: AuthenticatedAccount },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitCampaignDto,
  ): Promise<CampaignSubmittedResponseDto> {
    const { campaign, revisionNumber } = await this.submitService.submit(
      request.user.id,
      id,
      dto.expectedVersion,
    );

    return {
      id: campaign.id,
      status: campaign.status,
      version: campaign.version,
      revisionNumber,
      submittedAt: campaign.submittedAt,
    };
  }

  /* expectedVersion đi qua query nên luôn là chuỗi. */
  private parseExpectedVersion(raw: string): number {
    const version = Number(raw);
    if (!Number.isInteger(version) || version < 1) {
      throw new BadRequestException('expectedVersion must be an integer >= 1');
    }
    return version;
  }

  /* Header đi thẳng vào key Redis nên phải chặn độ dài, cùng lý do
   * AppThrottlerGuard chặn email dài bất thường. Chuỗi rỗng coi như không gửi.
   */
  private normalizeIdempotencyKey(raw?: string): string | undefined {
    const key = raw?.trim();
    if (!key) {
      return undefined;
    }
    if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
      throw new BadRequestException(
        `${CAMPAIGN_IDEMPOTENCY_HEADER} must be at most ${MAX_IDEMPOTENCY_KEY_LENGTH} characters`,
      );
    }
    return key;
  }
}
