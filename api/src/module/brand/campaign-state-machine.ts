import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
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

export function listCampaignTransitions(
  from: ECampaignStatus,
  actor?: ECampaignActorType,
): string[] {
  return ALL_CAMPAIGN_STATUSES.filter((to) => {
    const actors = CAMPAIGN_TRANSITIONS[from][to];
    return actor ? actors?.includes(actor) : Boolean(actors);
  }).map((to) => CAMPAIGN_STATUS_LABEL[to]);
}

/** Đích không hợp lệ thì 422, actor không được phép thì 403. */
export function assertCampaignTransition(
  from: ECampaignStatus,
  to: ECampaignStatus,
  actor: ECampaignActorType,
): void {
  const allowedActors = CAMPAIGN_TRANSITIONS[from][to];
  const fromLabel = CAMPAIGN_STATUS_LABEL[from];
  const toLabel = CAMPAIGN_STATUS_LABEL[to];

  if (!allowedActors) {
    const reachable = listCampaignTransitions(from);
    throw new UnprocessableEntityException({
      businessCode: EBusinessCode.CAMPAIGN_INVALID_TRANSITION,
      message: reachable.length
        ? `không chuyển được ${fromLabel} sang ${toLabel}; hợp lệ: ${reachable.join(', ')}`
        : `${fromLabel} là trạng thái cuối, không đổi được nữa`,
    });
  }

  if (!allowedActors.includes(actor)) {
    throw new ForbiddenException(
      `chỉ ${allowedActors.join(' hoặc ')} mới chuyển được ${fromLabel} sang ${toLabel}`,
    );
  }
}
