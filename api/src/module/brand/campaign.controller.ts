import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
// Đường dẫn tương đối, KHÔNG dùng 'src/...': nest build có rewrite nên dist vẫn
// chạy, nhưng check-routes.js nạp thẳng src qua ts-node và sẽ không phân giải được.
import { ERole } from '../../common/enum/roles.enum';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { Roles } from '../../security/roles.decorator';
import { RolesGuard } from '../../security/roles.guard';
import { AuthenticatedAccount } from '../auth/types/authenticated.types';
import { CampaignService } from './campaign.service';
import {
  CAMPAIGN_IDEMPOTENCY_HEADER,
  MAX_IDEMPOTENCY_KEY_LENGTH,
} from './constants/campaign.constants';
import { CampaignCreatedResponseDto } from './dto/campaign-response.dto';

@ApiTags('Brand-Campaign')
@ApiBearerAuth('access-token')
@Roles(ERole.BRAND)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('brand/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

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

  /**
   * Header đi thẳng vào key Redis nên phải chặn độ dài, cùng lý do
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
