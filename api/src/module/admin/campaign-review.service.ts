import {
  ConflictException,
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
  ECategoryPolicy,
  EReviewDecision,
  EReviewSubmissionStatus,
} from '../../common/enum/campaign.enum';
import {
  EAuditLogCategory,
  ELoginAction,
} from '../../common/enum/audit-log.enum';
import { ERole } from '../../common/enum/roles.enum';
import { AuditLogService } from './audit-log.service';
import { KycService } from '../kyc/kyc.service';
import { SystemConfigurationService } from '../system-configuration/system-configuration.service';
import { CampaignService } from '../brand/campaign.service';
import { CampaignTransitionService } from '../brand/campaign-transition.service';
import { CAMPAIGN_CONFIG_GROUP } from '../brand/constants/campaign.constants';
import {
  ApproveCampaignDto,
  CampaignApprovedResponseDto,
} from './dto/approve-campaign.dto';
import { Campaign } from '../brand/entities/campaign.entity';
import { CampaignCategory } from '../brand/entities/campaign-category.entity';
import { CampaignDeliverable } from '../brand/entities/campaign-deliverable.entity';
import { CampaignAsset } from '../brand/entities/campaign-asset.entity';
import { CampaignReviewSubmission } from '../brand/entities/campaign-review-submission.entity';
import {
  CampaignIssue,
  CampaignValidationInput,
} from '../brand/types/campaign.types';

@Injectable()
export class CampaignReviewService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaigns: Repository<Campaign>,
    @InjectRepository(CampaignReviewSubmission)
    private readonly submissions: Repository<CampaignReviewSubmission>,
    @InjectRepository(CampaignCategory)
    private readonly categories: Repository<CampaignCategory>,
    private readonly campaignService: CampaignService,
    private readonly transitions: CampaignTransitionService,
    private readonly configuration: SystemConfigurationService,
    private readonly kyc: KycService,
    private readonly audit: AuditLogService,
  ) {}

  @Transactional()
  async approve(
    submissionId: string,
    dto: ApproveCampaignDto,
    reviewerId: string,
  ): Promise<CampaignApprovedResponseDto> {
    const reference = await this.submissions.findOneBy({ id: submissionId });
    if (!reference)
      throw new NotFoundException('campaign review does not exist');

    // Luôn khóa campaign trước submission, cùng thứ tự với submit/withdraw.
    // Hai admin quyết định đồng thời: loser đọc lại trạng thái sau khi chờ khóa.
    const current = await this.campaigns.findOne({
      where: { id: reference.campaignId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!current) throw new NotFoundException('campaign does not exist');
    const submission = await this.submissions.findOne({
      where: { id: submissionId },
      lock: { mode: 'pessimistic_write' },
    });
    const latest = await this.submissions.findOne({
      where: { campaignId: current.id },
      order: { revisionNumber: 'DESC' },
      select: { id: true },
    });
    if (
      !submission ||
      submission.status !== EReviewSubmissionStatus.OPEN ||
      latest?.id !== submission.id ||
      current.status !== ECampaignStatus.PENDING_APPROVAL ||
      current.version !== dto.expectedCampaignVersion ||
      submission.campaignVersion !== current.version
    ) {
      throw this.conflict(
        'campaign review is stale or already decided',
        current,
      );
    }

    const content = this.hydrate(submission, current);
    // Đọc DB tại lúc quyết định; appliedPolicy cũ chỉ dùng giải thích, không cấp quyền.
    const config = await this.configuration.getByGroupFromDatabase(
      CAMPAIGN_CONFIG_GROUP,
    );
    const category = content.campaign.categoryId
      ? await this.categories.findOneBy({ id: content.campaign.categoryId })
      : null;
    const now = new Date();
    if (!(await this.kyc.isVerified(current.brandId, ERole.BRAND))) {
      throw new ForbiddenException({
        businessCode: EBusinessCode.CAMPAIGN_BRAND_NOT_VERIFIED,
        message: 'brand KYC is not verified or has expired',
      });
    }
    const { errors } = await this.campaignService.validateCampaign(
      { ...content, config, category },
      'approve',
      now,
    );
    if (errors.length) this.rejectValidation(errors, submission);
    if (
      category?.policy === ECategoryPolicy.RESTRICTED &&
      dto.checklistResult?.restrictedCategoryReviewed !== true
    ) {
      throw new UnprocessableEntityException({
        businessCode: EBusinessCode.CAMPAIGN_CHECKLIST_INCOMPLETE,
        message: 'restricted category requires explicit manual review',
        errors: [
          {
            code: 'CAMPAIGN_CHECKLIST_INCOMPLETE',
            fieldPath: 'checklistResult.restrictedCategoryReviewed',
            message: 'must be confirmed for the current restricted category',
          },
        ],
      });
    }

    const updated = await this.transitions.apply({
      campaignId: current.id,
      expectedVersion: dto.expectedCampaignVersion,
      expectedStatus: ECampaignStatus.PENDING_APPROVAL,
      next: ECampaignStatus.APPROVED,
      actor: { type: ECampaignActorType.ADMIN, id: reviewerId },
      patch: { approvedAt: now },
    });
    const decided = await this.submissions.update(
      { id: submission.id, status: EReviewSubmissionStatus.OPEN },
      {
        status: EReviewSubmissionStatus.DECIDED,
        decision: EReviewDecision.APPROVE,
        decidedBy: reviewerId,
        decidedAt: now,
        checklistResult: {
          restrictedCategoryReviewed:
            dto.checklistResult?.restrictedCategoryReviewed === true,
        },
      },
    );
    if (decided.affected !== 1) {
      throw this.conflict('campaign review was already decided', current);
    }
    await this.audit.writeRequired({
      category: EAuditLogCategory.APPROVAL,
      action: ELoginAction.APPROVE,
      accountId: reviewerId,
      resourceType: 'campaign',
      resourceId: current.id,
      metadata: {
        submissionId: submission.id,
        revisionNumber: submission.revisionNumber,
        campaignVersion: updated.version,
      },
    });
    return {
      id: updated.id,
      submissionId: submission.id,
      revisionNumber: submission.revisionNumber,
      status: updated.status,
      version: updated.version,
      approvedAt: now,
    };
  }

  private conflict(message: string, campaign: Campaign): ConflictException {
    return new ConflictException({
      businessCode: EBusinessCode.CAMPAIGN_VERSION_CONFLICT,
      message,
      status: campaign.status,
      version: campaign.version,
    });
  }

  private rejectValidation(
    errors: CampaignIssue[],
    submission: CampaignReviewSubmission,
  ): never {
    const issues = errors.map((issue) =>
      issue.code === 'CAMPAIGN_CASH_BELOW_FLOOR'
        ? {
            ...issue,
            metadata: {
              ...issue.metadata,
              previousFloor: submission.appliedPolicy.cashFloor.value,
              previousSourceKey: submission.appliedPolicy.cashFloor.sourceKey,
            },
          }
        : issue,
    );
    const business = issues.find(
      (issue) => EBusinessCode[issue.code as keyof typeof EBusinessCode],
    );
    throw new UnprocessableEntityException({
      businessCode: business
        ? EBusinessCode[business.code as keyof typeof EBusinessCode]
        : EBusinessCode.UNKNOWN_ERROR,
      message: 'campaign does not satisfy the current approval policy',
      errors: issues,
    });
  }

  private hydrate(
    submission: CampaignReviewSubmission,
    current: Campaign,
  ): Omit<CampaignValidationInput, 'config' | 'category'> {
    const snapshot = submission.snapshot;
    if (
      !snapshot?.campaign ||
      !Array.isArray(snapshot.deliverables) ||
      !Array.isArray(snapshot.assets)
    ) {
      throw this.conflict('campaign review snapshot is invalid', current);
    }
    const campaign = Object.assign(new Campaign(), snapshot.campaign, {
      id: current.id,
      brandId: current.brandId,
    });
    for (const field of [
      'recruitingStartAt',
      'applicationDeadline',
      'usageRightsUntil',
    ] as const) {
      campaign[field] = this.date(snapshot.campaign[field], current);
    }
    const deliverables = snapshot.deliverables.map((row) =>
      Object.assign(new CampaignDeliverable(), row, {
        contentSubmissionDeadline: this.date(
          row.contentSubmissionDeadline,
          current,
        ),
        publishDeadline: this.date(row.publishDeadline, current),
      }),
    );
    const assets = snapshot.assets.map((row) =>
      Object.assign(new CampaignAsset(), row),
    );
    return { campaign, deliverables, assets };
  }

  private date(value: unknown, campaign: Campaign): Date | null {
    if (value === null || value === undefined) return null;
    const date = typeof value === 'string' ? new Date(value) : null;
    if (!date || !Number.isFinite(date.getTime()))
      throw this.conflict(
        'campaign review snapshot contains an invalid date',
        campaign,
      );
    return date;
  }
}
