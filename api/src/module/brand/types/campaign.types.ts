import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import type { Campaign } from '../entities/campaign.entity';

export type {
  CampaignDeliverableDuration,
  CampaignProductBenefit,
  CampaignAppliedPolicy,
  CampaignIssue,
  CampaignSnapshot,
  CampaignValidationInput,
  CampaignValidationResult,
  CashFloorInput,
  CashFloorResolution,
} from '../interfaces/campaign.interfaces';

export type CampaignValidationMode = 'draft' | 'submit' | 'approve';
export type CampaignTransitionPatch = Omit<
  QueryDeepPartialEntity<Campaign>,
  'id' | 'brandId' | 'status' | 'version'
>;
export type { CampaignTransitionInput } from '../interfaces/campaign.interfaces';
