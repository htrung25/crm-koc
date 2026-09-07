import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import {
  ECampaignActorType,
  ECampaignStatus,
} from '../../common/enum/campaign.enum';
import {
  ALL_CAMPAIGN_STATUSES,
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_TRANSITIONS,
} from './constants/campaign.constants';
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
    // Chặn trước khi chạm DB: sai luật thì không tốn một câu SQL nào.
    this.assertTransition(input.expectedStatus, input.next, input.actor.type);

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

  /** Đích không hợp lệ thì 422, actor không được phép thì 403. */
  private assertTransition(
    from: ECampaignStatus,
    to: ECampaignStatus,
    actor: ECampaignActorType,
  ): void {
    const allowedActors = CAMPAIGN_TRANSITIONS[from][to];
    const fromLabel = CAMPAIGN_STATUS_LABEL[from];
    const toLabel = CAMPAIGN_STATUS_LABEL[to];

    if (!allowedActors) {
      const reachable = this.listTransitions(from);
      throw new UnprocessableEntityException({
        businessCode: EBusinessCode.CAMPAIGN_INVALID_TRANSITION,
        message: reachable.length
          ? `cannot move from ${fromLabel} to ${toLabel}; allowed: ${reachable.join(', ')}`
          : `${fromLabel} is a final state and cannot change`,
      });
    }

    if (!allowedActors.includes(actor)) {
      throw new ForbiddenException(
        `only ${allowedActors.join(' or ')} may move ${fromLabel} to ${toLabel}`,
      );
    }
  }

  private listTransitions(
    from: ECampaignStatus,
    actor?: ECampaignActorType,
  ): string[] {
    return ALL_CAMPAIGN_STATUSES.filter((to) => {
      const actors = CAMPAIGN_TRANSITIONS[from][to];
      return actor ? actors?.includes(actor) : Boolean(actors);
    }).map((to) => CAMPAIGN_STATUS_LABEL[to]);
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
      return new NotFoundException('campaign does not exist');
    }

    // Kèm dữ liệu mới nhất của server: client phải tải lại được chứ không phải
    // đoán mò xem mình đang lệch cái gì.
    return new ConflictException({
      businessCode: EBusinessCode.CAMPAIGN_VERSION_CONFLICT,
      message:
        current.status !== input.expectedStatus
          ? `campaign is ${CAMPAIGN_STATUS_LABEL[current.status]}, not ${CAMPAIGN_STATUS_LABEL[input.expectedStatus]}`
          : 'campaign was modified by another operation',
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
