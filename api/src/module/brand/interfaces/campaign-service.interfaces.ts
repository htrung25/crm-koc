import { Campaign } from '../entities/campaign.entity';
import { CampaignDeliverable } from '../entities/campaign-deliverable.entity';

export interface CampaignDetail {
  campaign: Campaign;
  deliverables: CampaignDeliverable[];
}
