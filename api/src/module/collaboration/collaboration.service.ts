import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { EAccountStatus } from '../../common/enum/account-statuses.enum';
import { ECollaborationStatus } from '../../common/enum/collaboration-status.enum';
import { ESortField, ESortOrder } from '../../common/enum/sort-fields.enum';
import {
  assertEnum,
  assertNumericEnum,
} from '../../common/util/enum-assert.util';
import { PaginatedResult, paginate } from '../../common/util/pagination.util';
import { uniqueViolationOf } from '../../common/util/pg-error.util';
import { AuthEntity } from '../auth/entities/auth.entity';
import { ERole } from '../../common/enum/roles.enum';
import {
  ALL_STATUSES,
  TRANSITION_ACTORS,
  OPEN_STATUSES,
  STATUS_LABEL,
  STATUS_TIMESTAMP,
  COLLABORATION_LIST_FIELDS,
} from './constants/collaboration.constants';
import { BrandProfileService } from '../brand/brand-profile.service';
import { CreatorProfileService } from '../creator/creator-profile.service';
import { CampaignService } from '../brand/campaign.service';
import { Campaign } from '../brand/entities/campaign.entity';
import { SocialAccount } from '../creator/entities/social-account.entity';
import { SystemConfigurationService } from '../system-configuration/system-configuration.service';
import { CAMPAIGN_CONFIG_GROUP } from '../brand/constants/campaign.constants';
import { CAMPAIGN_STATUS_LABEL } from '../brand/constants/campaign.constants';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import {
  ECampaignStatus,
  ECompensationType,
  EPricingModel,
} from '../../common/enum/campaign.enum';
import type { CampaignIssue } from '../brand/types/campaign.types';
import {
  CollaborationFilterDto,
  CreateCollaborationDto,
} from './dto/collaboration.dto';
import { assertSortField } from './constants/collaboration.constants';
import { Collaboration } from './entities/collaboration.entity';
import { CollaborationActor } from './types/collaboration.types';
import { CollaborationListItem } from './types/collaboration.types';

@Injectable()
export class CollaborationService {
  constructor(
    @InjectRepository(Collaboration)
    private readonly collaborationRepository: Repository<Collaboration>,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
    private readonly campaignService: CampaignService,
    private readonly configService: SystemConfigurationService,
    private readonly brandProfileService: BrandProfileService,
    private readonly creatorProfileService: CreatorProfileService,
  ) {}

  async create(
    brandId: string,
    dto: CreateCollaborationDto,
  ): Promise<Collaboration & { warnings: CampaignIssue[] }> {
    // 1. Brand phải có hồ sơ: FK trỏ brand_profiles chứ không phải accounts.
    const brand = await this.brandProfileService.findByAccountId(brandId);
    if (!brand) {
      throw new NotFoundException('brand profile not found');
    }

    // 2. Creator cũng vậy.
    const creator = await this.creatorProfileService.findByAccountId(
      dto.creatorId,
    );
    if (!creator) {
      throw new NotFoundException('creator profile not found');
    }

    if (brandId === dto.creatorId) {
      throw new BadRequestException(
        'Brand cannot collaborate with its own creator profile',
      );
    }

    // 4. Ban chỉ đổi accounts.status, dòng creator_profiles vẫn còn. Không
    // kiểm ở đây thì brand vẫn hợp tác được với người vừa bị khoá tài khoản.
    const creatorAccount = await this.authRepository.findOne({
      where: { id: dto.creatorId },
      select: { id: true, status: true },
    });
    if (
      creatorAccount?.status === EAccountStatus.SUSPENDED ||
      creatorAccount?.status === EAccountStatus.BANNED
    ) {
      throw new BadRequestException('creator account is not active');
    }

    // 4b. Campaign phải thuộc chính brand đang gọi, đã được duyệt, và giá phải
    // khớp cam kết của nó. Một truy vấn cho cả ba việc.
    let warnings: CampaignIssue[] = [];
    if (dto.campaignId) {
      const campaign = await this.campaignRepository.findOne({
        where: { id: dto.campaignId, brandId },
      });
      if (!campaign) {
        throw new NotFoundException('campaign does not exist');
      }

      this.assertCampaignApproved(campaign);
      await this.assertPriceMatchesCampaign(campaign, dto.agreedPrice);
      warnings = await this.creatorCriteriaWarnings(campaign, dto.creatorId);
    }

    // Kiểm tra sớm để trả lỗi rõ ràng; unique index mới là chốt chống race.
    const open = await this.collaborationRepository.findOne({
      where: {
        brandId,
        creatorId: dto.creatorId,
        campaignId: dto.campaignId ?? IsNull(),
        status: In(OPEN_STATUSES),
      },
      select: { id: true },
    });
    if (open) {
      throw new ConflictException(
        'an open collaboration with this creator already exists',
      );
    }

    // 6 + 7. numeric nhận number, đọc ra lại là chuỗi (D9) nên ép về String.
    const collaboration = this.collaborationRepository.create({
      brandId,
      creatorId: dto.creatorId,
      campaignId: dto.campaignId ?? null,
      status: ECollaborationStatus.PENDING,
      agreedPrice:
        dto.agreedPrice === undefined ? null : String(dto.agreedPrice),
    });

    // 8. Entity trùng khít CollaborationDto nên trả thẳng, không map lại.
    try {
      const saved = await this.collaborationRepository.save(collaboration);
      return { ...saved, warnings };
    } catch (error) {
      const constraint = uniqueViolationOf(error);
      if (
        constraint === 'UQ_collaborations_open_campaign' ||
        constraint === 'UQ_collaborations_open_direct'
      ) {
        throw new ConflictException(
          'an open collaboration with this creator already exists',
        );
      }
      throw error;
    }
  }

  /*Chỉ campaign ĐÃ DUYỆT mới gắn hợp tác được*/
  private assertCampaignApproved(campaign: Campaign): void {
    if (campaign.status === ECampaignStatus.APPROVED) {
      return;
    }
    throw new UnprocessableEntityException({
      businessCode: EBusinessCode.CAMPAIGN_INVALID_TRANSITION,
      message: `campaign is ${CAMPAIGN_STATUS_LABEL[campaign.status]}, only approved campaigns accept collaborations`,
      status: campaign.status,
    });
  }

  private async assertPriceMatchesCampaign(
    campaign: Campaign,
    agreedPrice?: number,
  ): Promise<void> {
    if (campaign.compensationType === ECompensationType.PRODUCT) {
      if (agreedPrice) {
        throw new UnprocessableEntityException({
          businessCode: EBusinessCode.CAMPAIGN_BUDGET_MISMATCH,
          message: 'campaign pays in product only, agreedPrice must be empty',
        });
      }
      return;
    }

    if (agreedPrice === undefined) {
      throw new UnprocessableEntityException({
        businessCode: EBusinessCode.CAMPAIGN_BUDGET_MISMATCH,
        message: 'agreedPrice is required for a campaign that pays cash',
      });
    }

    const price = BigInt(agreedPrice);

    if (campaign.pricingModel === EPricingModel.FIXED) {
      const unit = campaign.cashUnitPrice;
      if (unit !== null && price !== BigInt(unit)) {
        throw new UnprocessableEntityException({
          businessCode: EBusinessCode.CAMPAIGN_BUDGET_MISMATCH,
          message: `campaign pricing is fixed at ${unit}, agreedPrice must match`,
        });
      }
      return;
    }

    const min = campaign.minCashUnitPrice;
    const max = campaign.maxCashUnitPrice;
    if (
      (min !== null && price < BigInt(min)) ||
      (max !== null && price > BigInt(max))
    ) {
      throw new UnprocessableEntityException({
        businessCode: EBusinessCode.CAMPAIGN_PRICE_RANGE_INVALID,
        message: `agreedPrice must be within [${min ?? '-'}, ${max ?? '-'}]`,
      });
    }

    // Sàn đọc theo cấu hình HIỆN HÀNH, không phải applied_policy lúc gửi duyệt:
    // sàn tăng sau khi campaign được duyệt thì hợp tác mới vẫn phải theo sàn mới.
    const config = await this.configService.getByGroup(CAMPAIGN_CONFIG_GROUP);
    const floor = await this.campaignService.resolveCashFloor(config, {
      compensationType: campaign.compensationType!,
    });
    if (floor.value !== null && price < floor.value) {
      throw new UnprocessableEntityException({
        businessCode: EBusinessCode.CAMPAIGN_CASH_BELOW_FLOOR,
        message: `${price} is below the floor of ${floor.value}`,
        metadata: { floor: floor.value.toString(), sourceKey: floor.sourceKey },
      });
    }
  }

  private async creatorCriteriaWarnings(
    campaign: Campaign,
    creatorId: string,
  ): Promise<CampaignIssue[]> {
    const wanted = campaign.creatorPlatforms ?? [];
    const minFollowers = campaign.creatorMinFollowers;
    const minEngagement = campaign.creatorMinEngagementRate;
    if (!wanted.length && minFollowers === null && minEngagement === null) {
      return [];
    }

    const accounts = await this.socialAccountRepository.find({
      where: { creatorProfileId: creatorId, isActive: true },
      select: {
        platform: true,
        followerCount: true,
        engagementRate: true,
      },
    });

    const warnings: CampaignIssue[] = [];
    const owned = new Set(accounts.map((a) => a.platform));
    const missing = wanted.filter((p) => !owned.has(p));
    if (missing.length) {
      warnings.push({
        code: EBusinessCode[EBusinessCode.CAMPAIGN_PLATFORM_MISMATCH],
        fieldPath: 'creatorId',
        message: `creator has no active account on ${missing.join(', ')}`,
        metadata: { missing },
      });
    }

    // So trên nền tảng TỐT NHẤT của creator, không phải tổng: campaign yêu cầu
    // một kênh đạt ngưỡng, không phải cộng dồn mọi kênh.
    if (minFollowers !== null) {
      const best = accounts.reduce(
        (max, a) =>
          BigInt(a.followerCount) > max ? BigInt(a.followerCount) : max,
        0n,
      );
      if (best < BigInt(minFollowers)) {
        warnings.push({
          code: 'minFollowers',
          fieldPath: 'creatorId',
          message: `creator's best channel has ${best} followers, campaign asks for ${minFollowers}`,
        });
      }
    }

    if (minEngagement !== null) {
      const best = accounts.reduce(
        (max, a) => Math.max(max, Number(a.engagementRate ?? 0)),
        0,
      );
      if (best < Number(minEngagement)) {
        warnings.push({
          code: 'minEngagementRate',
          fieldPath: 'creatorId',
          message: `creator's best engagement rate is ${best}, campaign asks for ${minEngagement}`,
        });
      }
    }

    return warnings;
  }

  async findAll(
    actor: CollaborationActor,
    query: CollaborationFilterDto,
  ): Promise<PaginatedResult<CollaborationListItem>> {
    const scopeColumn = actor.role === ERole.CREATOR ? 'creatorId' : 'brandId';

    const qb = this.collaborationRepository
      .createQueryBuilder('collaboration')
      .select(COLLABORATION_LIST_FIELDS.map((f) => `collaboration.${f}`))
      .where(`collaboration.${scopeColumn} = :actorId`, { actorId: actor.id });

    if (query.status !== undefined) {
      qb.andWhere('collaboration.status = :status', {
        status: assertNumericEnum(ECollaborationStatus, query.status, 'status'),
      });
    }

    if (query.creatorId) {
      qb.andWhere('collaboration.creatorId = :creatorId', {
        creatorId: query.creatorId,
      });
    }

    if (query.campaignId) {
      qb.andWhere('collaboration.campaignId = :campaignId', {
        campaignId: query.campaignId,
      });
    }

    if (query.createdFrom) {
      qb.andWhere('collaboration.createdAt >= :from', {
        from: query.createdFrom,
      });
    }
    if (query.createdTo) {
      const to = new Date(query.createdTo);
      to.setDate(to.getDate() + 1);
      qb.andWhere('collaboration.createdAt < :to', { to });
    }

    // So sánh ở SQL để numeric không phải đi vòng qua float của JS.
    if (query.minPrice !== undefined) {
      qb.andWhere('collaboration.agreedPrice >= :minPrice', {
        minPrice: query.minPrice,
      });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('collaboration.agreedPrice <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    // orderBy ghép chuỗi raw vào SQL => bắt buộc whitelist, không tin input
    const sortBy =
      query.sortBy === undefined
        ? ESortField.CREATED_AT
        : assertSortField(query.sortBy);
    const sortOrder =
      query.sortOrder === undefined
        ? ESortOrder.DESC
        : assertEnum(ESortOrder, query.sortOrder, 'sortOrder');

    qb.orderBy(`collaboration.${sortBy}`, sortOrder);
    // khoá thứ tự bằng id để phân trang ổn định khi trùng giá trị sort
    qb.addOrderBy('collaboration.id', ESortOrder.ASC);

    return paginate(qb, query);
  }

  async updateStatus(
    actor: CollaborationActor,
    id: string,
    next: ECollaborationStatus,
  ): Promise<Collaboration> {
    const collab = await this.collaborationRepository.findOneBy({ id });
    // Không phải bên nào của hợp tác này thì trả 404 chứ không 403: 403 xác
    // nhận hợp tác có tồn tại, đủ để dò UUID.
    if (!collab || !this.canSee(actor, collab)) {
      throw new NotFoundException('collaboration not found');
    }

    this.assertTransition(collab.status, next, actor.role);

    const patch: Partial<Collaboration> = { status: next };
    // Chỉ ghi lần đầu vào trạng thái đó: quay lại qua ngả DISPUTED hay bị trả
    // bài không được ghi đè mốc thật.
    const field = STATUS_TIMESTAMP[next];
    if (field && collab[field] === null) {
      patch[field] = new Date();
    }

    const result = await this.collaborationRepository.update(
      { id, status: collab.status },
      patch,
    );
    if (result.affected === 0) {
      throw new ConflictException(
        'collaboration was changed by someone else, reload and try again',
      );
    }

    return this.collaborationRepository.findOneByOrFail({ id });
  }

  /** Admin xem được tất cả; hai bên còn lại chỉ xem hợp tác của mình. */
  private canSee(actor: CollaborationActor, collab: Collaboration): boolean {
    return (
      actor.role === ERole.ADMIN ||
      collab.brandId === actor.id ||
      collab.creatorId === actor.id
    );
  }

  /** Lỗi dùng tên trạng thái chứ không phải số, để FE hiện thẳng cho người dùng. */
  private assertTransition(
    current: ECollaborationStatus,
    next: ECollaborationStatus,
    role: ERole,
  ): void {
    const transitions = TRANSITION_ACTORS[current];
    const actors = transitions[next];
    const from = STATUS_LABEL[current];
    const to = STATUS_LABEL[next];

    if (!actors) {
      const allowed = ALL_STATUSES.filter((status) => transitions[status]).map(
        (status) => STATUS_LABEL[status],
      );
      throw new BadRequestException(
        allowed.length === 0
          ? `${from} is a final status and cannot be changed`
          : `cannot change status from ${from} to ${to}; allowed: ${allowed.join(', ')}`,
      );
    }

    if (!actors.includes(role)) {
      throw new ForbiddenException(
        `only ${actors.join(' or ')} can change status from ${from} to ${to}`,
      );
    }
  }

  async countSuccessfulCreators(brandId: string): Promise<number> {
    const result = await this.collaborationRepository
      .createQueryBuilder('collaboration')
      .select(
        'COUNT(DISTINCT collaboration.creatorId)',
        'successfulCreatorCount',
      )
      .where('collaboration.brandId = :brandId', { brandId })
      .andWhere('collaboration.status = :status', {
        status: ECollaborationStatus.COMPLETED,
      })
      .getRawOne<{ successfulCreatorCount: string }>();

    // COUNT trả bigint nên driver pg cho ra chuỗi; không ép kiểu thì "2" lọt ra API.
    return Number(result?.successfulCreatorCount ?? 0);
  }

  /** Số LƯỢT hoàn thành. Khác countSuccessfulCreators: cùng creator tính nhiều lần. */
  async countSuccessfulByBrand(brandId: string): Promise<number> {
    return this.collaborationRepository.count({
      where: {
        brandId,
        status: ECollaborationStatus.COMPLETED,
      },
    });
  }
}
