import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import { ECampaignActorType } from '../../common/enum/campaign.enum';
import { assertCampaignTransition } from './campaign-state-machine';
import { CAMPAIGN_STATUS_LABEL } from './constants/campaign.constants';
import { Campaign } from './entities/campaign.entity';
import { CampaignStatusHistory } from './entities/campaign-status-history.entity';
import type { CampaignTransitionInput } from './types/campaign.types';

@Injectable()
export class CampaignTransitionService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignStatusHistory)
    private readonly historyRepository: Repository<CampaignStatusHistory>,
  ) {}

  @Transactional()
  async apply(input: CampaignTransitionInput): Promise<Campaign> {
    // Hàm thuần, chặn trước khi chạm DB: sai luật thì không tốn một câu SQL nào.
    assertCampaignTransition(
      input.expectedStatus,
      input.next,
      input.actor.type,
    );

    const affected = await this.conditionalUpdate(input);
    if (!affected) {
      throw await this.staleWriteError(input);
    }

    const campaign = await this.campaignRepository.findOneByOrFail({
      id: input.campaignId,
    });

    await this.appendHistory(input, campaign);
    return campaign;
  }

  private async conditionalUpdate(
    input: CampaignTransitionInput,
  ): Promise<number> {
    const query = this.campaignRepository
      .createQueryBuilder()
      .update(Campaign)
      .set({
        ...input.patch,
        status: input.next,
        version: () => '"version" + 1',
      })
      .where('id = :id', { id: input.campaignId })
      .andWhere('status = :expectedStatus', {
        expectedStatus: input.expectedStatus,
      });

    // Ràng quyền sở hữu ngay trong WHERE: brand khác không đổi được, và cũng
    // không phân biệt được 404 với 409 để dò xem campaign có tồn tại hay không.
    if (input.brandId !== undefined) {
      query.andWhere('brand_id = :brandId', { brandId: input.brandId });
    }

    // SYSTEM không đọc trước nên không có version để so; chạy lại thấy status
    // đã đổi thì affected = 0 và caller tự hiểu là đã có người làm rồi.
    if (input.expectedVersion !== undefined) {
      query.andWhere('version = :expectedVersion', {
        expectedVersion: input.expectedVersion,
      });
    }

    const result = await query.execute();
    return result.affected ?? 0;
  }

  private async staleWriteError(
    input: CampaignTransitionInput,
  ): Promise<HttpException> {
    const current = await this.campaignRepository.findOne({
      where: { id: input.campaignId },
      select: { id: true, brandId: true, status: true, version: true },
    });

    if (!current || (input.brandId && current.brandId !== input.brandId)) {
      return new NotFoundException('campaign không tồn tại');
    }

    // Kèm dữ liệu mới nhất của server: client phải tải lại được chứ không phải
    // đoán mò xem mình đang lệch cái gì.
    return new ConflictException({
      businessCode: EBusinessCode.CAMPAIGN_VERSION_CONFLICT,
      message:
        current.status !== input.expectedStatus
          ? `campaign đang ở ${CAMPAIGN_STATUS_LABEL[current.status]}, không phải ${CAMPAIGN_STATUS_LABEL[input.expectedStatus]}`
          : 'campaign đã được sửa bởi thao tác khác',
      status: current.status,
      version: current.version,
    });
  }

  /** Chỉ ghi thêm. Không có method sửa hay xoá ở đây, và không class nào khác chạm được vào bảng này — đó là toàn bộ cách "append-only" được bảo đảm.*/
  private async appendHistory(
    input: CampaignTransitionInput,
    updated: Campaign,
  ): Promise<void> {
    await this.historyRepository.insert({
      campaignId: updated.id,
      fromStatus: input.expectedStatus,
      toStatus: updated.status,
      // Lấy ngược từ version sau khi tăng, đúng cả khi caller không gửi
      // expectedVersion (SYSTEM).
      beforeVersion: updated.version - 1,
      afterVersion: updated.version,
      actorType: input.actor.type,
      actorId:
        input.actor.type === ECampaignActorType.SYSTEM ? null : input.actor.id,
      reasonCode: input.reasonCode ?? null,
      note: input.note ?? null,
      correlationId: input.correlationId ?? null,
    });
  }
}
