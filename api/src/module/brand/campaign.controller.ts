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
    summary: 'Tạo campaign rỗng ở trạng thái nháp',
    description:
      'Không nhận dữ liệu nghiệp vụ: trả về id để wizard autosave ghi vào. ' +
      'Gửi lại cùng Idempotency-Key sẽ nhận đúng campaign lần trước thay vì ' +
      'tạo thêm bản nháp mới.',
  })
  @ApiHeader({
    name: CAMPAIGN_IDEMPOTENCY_HEADER,
    required: false,
    description: 'Chuỗi client tự sinh, nên dùng uuid. Sống 24 giờ.',
  })
  @ApiCreatedResponse({ type: CampaignCreatedResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Thiếu token, token sai hoặc hết hạn',
  })
  @ApiForbiddenResponse({ description: 'Không phải tài khoản brand' })
  @ApiUnprocessableEntityResponse({
    description: 'Chạm trần số campaign chưa kết thúc',
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
    summary: 'Mở lại một campaign kèm deliverables',
    description:
      'Trả về cả wizardStep để client nhảy đúng bước đang dở, và version để ' +
      'gửi kèm ở lệnh sửa kế tiếp.',
  })
  @ApiOkResponse({ description: 'Campaign và danh sách deliverable' })
  @ApiUnauthorizedResponse({
    description: 'Thiếu token, token sai hoặc hết hạn',
  })
  @ApiForbiddenResponse({ description: 'Không phải tài khoản brand' })
  @ApiNotFoundResponse({ description: 'Campaign không tồn tại' })
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
    summary: 'Autosave bản nháp',
    description:
      'Trường vắng mặt: không đụng tới. Trường bằng null: xoá giá trị cũ. ' +
      'Chỉ chặn sai kiểu, quá dài, sai enum — thiếu dữ liệu là bình thường ' +
      'với bản nháp. cashBudget do server tính, gửi lên sẽ bị từ chối.',
  })
  @ApiQuery({
    name: 'expectedVersion',
    type: Number,
    description: 'Version client đang giữ, để chống ghi đè',
  })
  @ApiOkResponse({ type: Campaign })
  @ApiUnauthorizedResponse({
    description: 'Thiếu token, token sai hoặc hết hạn',
  })
  @ApiForbiddenResponse({ description: 'Không phải tài khoản brand' })
  @ApiNotFoundResponse({ description: 'Campaign không tồn tại' })
  @ApiConflictResponse({ description: 'Version đã thay đổi' })
  @ApiUnprocessableEntityResponse({
    description: 'Campaign đang ở trạng thái không sửa được',
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
    summary: 'Đồng bộ toàn bộ danh sách deliverable',
    description:
      'Gửi lên trạng thái hiện tại của bước 3, không phải chuỗi thao tác. ' +
      'Dòng có id thì sửa, không id thì thêm, vắng mặt khỏi mảng thì XOÁ. ' +
      'position do server gán theo thứ tự phần tử.',
  })
  @ApiOkResponse({ type: [CampaignDeliverable] })
  @ApiUnauthorizedResponse({
    description: 'Thiếu token, token sai hoặc hết hạn',
  })
  @ApiForbiddenResponse({ description: 'Không phải tài khoản brand' })
  @ApiNotFoundResponse({ description: 'Campaign không tồn tại' })
  @ApiConflictResponse({ description: 'Version đã thay đổi' })
  @ApiUnprocessableEntityResponse({
    description: 'Campaign đang ở trạng thái không sửa được',
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
    summary: 'Gửi campaign cho admin duyệt',
    description:
      'Chốt một bản chụp bất biến rồi chuyển sang PENDING_APPROVAL. Thiếu ' +
      'dữ liệu thì trả 422 kèm errors[] và campaign giữ nguyên trạng thái.',
  })
  @ApiOkResponse({ type: CampaignSubmittedResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Thiếu token, token sai hoặc hết hạn',
  })
  @ApiForbiddenResponse({
    description: 'Brand chưa VERIFIED, hoặc bị từ chối với lý do cấm gửi lại',
  })
  @ApiNotFoundResponse({ description: 'Campaign không tồn tại' })
  @ApiConflictResponse({ description: 'Version đã thay đổi' })
  @ApiUnprocessableEntityResponse({
    description: 'Dữ liệu chưa đủ điều kiện gửi duyệt, hoặc sai trạng thái',
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
      throw new BadRequestException('expectedVersion phải là số nguyên >= 1');
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
        `${CAMPAIGN_IDEMPOTENCY_HEADER} tối đa ${MAX_IDEMPOTENCY_KEY_LENGTH} ký tự`,
      );
    }
    return key;
  }
}
