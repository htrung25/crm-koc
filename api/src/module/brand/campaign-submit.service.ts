import {
  ForbiddenException,
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
import { ERole } from '../../common/enum/roles.enum';
import { KycService } from '../kyc/kyc.service';
import { SystemConfigurationService } from '../system-configuration/system-configuration.service';
import { CampaignService } from './campaign.service';
import { CampaignTransitionService } from './campaign-transition.service';
import {
  CAMPAIGN_CONFIG_GROUP,
  CAMPAIGN_SNAPSHOT_EXCLUDED_COLUMNS,
  CAMPAIGN_STATUS_LABEL,
  EDITABLE_CAMPAIGN_STATUSES,
  NON_RESUBMITTABLE_REJECT_REASONS,
} from './constants/campaign.constants';
import { Campaign } from './entities/campaign.entity';
import { CampaignAsset } from './entities/campaign-asset.entity';
import { CampaignCategory } from './entities/campaign-category.entity';
import { CampaignDeliverable } from './entities/campaign-deliverable.entity';
import { CampaignReviewSubmission } from './entities/campaign-review-submission.entity';
import type {
  CampaignAppliedPolicy,
  CampaignIssue,
  CampaignSnapshot,
} from './types/campaign.types';

export interface CampaignSubmitResult {
  campaign: Campaign;
  revisionNumber: number;
}

@Injectable()
export class CampaignSubmitService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignDeliverable)
    private readonly deliverableRepository: Repository<CampaignDeliverable>,
    @InjectRepository(CampaignAsset)
    private readonly assetRepository: Repository<CampaignAsset>,
    @InjectRepository(CampaignCategory)
    private readonly categoryRepository: Repository<CampaignCategory>,
    @InjectRepository(CampaignReviewSubmission)
    private readonly submissionRepository: Repository<CampaignReviewSubmission>,
    private readonly campaignService: CampaignService,
    private readonly transitionService: CampaignTransitionService,
    private readonly configService: SystemConfigurationService,
    private readonly kycService: KycService,
  ) {}

  @Transactional()
  async submit(
    brandId: string,
    id: string,
    expectedVersion: number,
  ): Promise<CampaignSubmitResult> {
    const campaign = await this.campaignRepository.findOne({
      where: { id, brandId },
    });
    if (!campaign) {
      throw new NotFoundException('campaign does not exist');
    }

    this.assertSubmittable(campaign);
    await this.assertResubmitAllowed(campaign);
    await this.assertBrandVerified(brandId);

    const [deliverables, assets, category, config] = await Promise.all([
      this.deliverableRepository.find({
        where: { campaignId: id },
        order: { position: 'ASC' },
      }),
      this.assetRepository.find({
        where: { campaignId: id },
        order: { kind: 'ASC', position: 'ASC' },
      }),
      campaign.categoryId
        ? this.categoryRepository.findOneBy({ id: campaign.categoryId })
        : Promise.resolve(null),
      this.configService.getByGroup(CAMPAIGN_CONFIG_GROUP),
    ]);

    const { errors } = await this.campaignService.validateCampaign(
      { campaign, deliverables, assets, category, config },
      'submit',
    );
    if (errors.length > 0) {
      throw this.validationError(errors);
    }

    const appliedPolicy = await this.buildAppliedPolicy(
      campaign,
      category,
      config,
    );

    // apply() ràng status nguồn ngay trong WHERE nên hai lượt submit song song
    // chỉ một cái qua; nhờ đó revision_number tính bằng MAX+1 là an toàn.
    const updated = await this.transitionService.apply({
      campaignId: id,
      brandId,
      expectedVersion,
      expectedStatus: campaign.status,
      next: ECampaignStatus.PENDING_APPROVAL,
      actor: { type: ECampaignActorType.BRAND, id: brandId },
      patch: { submittedAt: new Date() },
    });

    const revisionNumber = await this.nextRevisionNumber(id);
    // save() thay vì insert(): insert() nhận QueryDeepPartialEntity nên nó bóc
    // cả object jsonb ra thành từng khoá, và kiểu của snapshot không khớp nữa.
    await this.submissionRepository.save(
      this.submissionRepository.create({
        campaignId: id,
        revisionNumber,
        // Version SAU khi apply() tăng: đó mới là bản mà snapshot chụp lại.
        campaignVersion: updated.version,
        snapshot: this.buildSnapshot(campaign, deliverables, assets),
        appliedPolicy,
        submittedBy: brandId,
      }),
    );

    return { campaign: updated, revisionNumber };
  }

  private assertSubmittable(campaign: Campaign): void {
    if (!EDITABLE_CAMPAIGN_STATUSES.includes(campaign.status)) {
      throw new UnprocessableEntityException({
        businessCode: EBusinessCode.CAMPAIGN_INVALID_TRANSITION,
        message: `campaign is ${CAMPAIGN_STATUS_LABEL[campaign.status]} and cannot be submitted for review`,
        status: campaign.status,
        version: campaign.version,
      });
    }
  }

  /** Lý do từ chối nằm ở hồ sơ duyệt gần nhất, không phải trên campaign. */
  private async assertResubmitAllowed(campaign: Campaign): Promise<void> {
    if (campaign.status !== ECampaignStatus.REJECTED) {
      return;
    }

    const last = await this.submissionRepository.findOne({
      where: { campaignId: campaign.id },
      order: { revisionNumber: 'DESC' },
      select: { id: true, reasonCode: true },
    });

    if (
      last?.reasonCode &&
      NON_RESUBMITTABLE_REJECT_REASONS.includes(last.reasonCode)
    ) {
      throw new ForbiddenException({
        businessCode: EBusinessCode.CAMPAIGN_BRAND_NOT_VERIFIED,
        message: `campaign was rejected as ${last.reasonCode} and cannot be resubmitted`,
      });
    }
  }

  private async assertBrandVerified(brandId: string): Promise<void> {
    if (await this.kycService.isVerified(brandId, ERole.BRAND)) {
      return;
    }
    throw new ForbiddenException({
      businessCode: EBusinessCode.CAMPAIGN_BRAND_NOT_VERIFIED,
      message: 'brand KYC is not verified yet, campaigns cannot be submitted',
    });
  }

  private validationError(
    errors: CampaignIssue[],
  ): UnprocessableEntityException {
    const business = errors.find(
      (issue) => EBusinessCode[issue.code as keyof typeof EBusinessCode],
    );

    return new UnprocessableEntityException({
      businessCode: business
        ? EBusinessCode[business.code as keyof typeof EBusinessCode]
        : EBusinessCode.UNKNOWN_ERROR,
      message: 'campaign is not ready to be submitted for review',
      errors,
    });
  }

  private async buildAppliedPolicy(
    campaign: Campaign,
    category: CampaignCategory | null,
    config: Record<string, unknown>,
  ): Promise<CampaignAppliedPolicy> {
    const floor = campaign.compensationType
      ? await this.campaignService.resolveCashFloor(config, {
          compensationType: campaign.compensationType,
        })
      : { value: null, sourceKey: null };

    return {
      capturedAt: new Date().toISOString(),
      cashFloor: {
        value: floor.value === null ? null : floor.value.toString(),
        sourceKey: floor.sourceKey,
      },
      category: { id: category?.id ?? null, policy: category?.policy ?? null },
    };
  }

  /** Chụp theo GIÁ TRỊ. Tiền vốn đã là chuỗi vì cột bigint. */
  private buildSnapshot(
    campaign: Campaign,
    deliverables: CampaignDeliverable[],
    assets: CampaignAsset[],
  ): CampaignSnapshot {
    const content = Object.fromEntries(
      Object.entries(campaign).filter(
        ([column]) => !CAMPAIGN_SNAPSHOT_EXCLUDED_COLUMNS.includes(column),
      ),
    );

    return {
      campaign: content,
      deliverables: deliverables.map(({ id, campaignId, ...rest }) => rest),
      assets: assets.map((asset) => ({
        kind: asset.kind,
        position: asset.position,
        storageKey: asset.storageKey,
        originalName: asset.originalName,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        checksum: asset.checksum,
      })),
    };
  }

  private async nextRevisionNumber(campaignId: string): Promise<number> {
    const row = await this.submissionRepository
      .createQueryBuilder('submission')
      .select('MAX(submission.revision_number)', 'max')
      .where('submission.campaign_id = :campaignId', { campaignId })
      .getRawOne<{ max: string | null }>();

    return Number(row?.max ?? 0) + 1;
  }
}
