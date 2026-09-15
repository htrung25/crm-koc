import { Campaign } from '../entities/campaign.entity';

export interface CampaignSubmitResult {
  campaign: Campaign;
  revisionNumber: number;
  submissionId: string;
}
