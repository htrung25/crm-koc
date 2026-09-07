import { randomBytes } from 'node:crypto';
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { RedisClientType } from 'redis';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import {
  ECampaignAssetKind,
  ECategoryPolicy,
  ECompensationType,
  EPricingModel,
  EUsageRightsKind,
} from '../../common/enum/campaign.enum';
import { ESocialPlatform } from '../../common/enum/social-platform.enum';
import { REDIS_CLIENT, redisKeys } from '../../infra/redis.module';
import { uniqueViolationOf } from '../../common/util/pg-error.util';
import {
  CAMPAIGN_CODE_ALPHABET,
  CAMPAIGN_CODE_LENGTH,
  CAMPAIGN_CODE_MAX_ATTEMPTS,
  CAMPAIGN_CODE_PREFIX,
  CAMPAIGN_CONFIG_KEY,
  CAMPAIGN_IDEMPOTENCY_TTL_SECONDS,
  CAMPAIGN_STATUS_LABEL,
  EDITABLE_CAMPAIGN_STATUSES,
  MAX_PRODUCT_IMAGES_FALLBACK,
  MAX_UNFINISHED_CAMPAIGNS_PER_BRAND,
  MIN_HOURS_BEFORE_APPLICATION_DEADLINE,
  PLATFORM_CONTENT_TYPES,
  UNFINISHED_CAMPAIGN_STATUSES,
} from './constants/campaign.constants';
import { Campaign } from './entities/campaign.entity';
import { CampaignDeliverable } from './entities/campaign-deliverable.entity';
import type { DeliverableItemDto } from './dto/sync-deliverables.dto';
import type { UpdateCampaignDto } from './dto/update-campaign.dto';
import type {
  CampaignIssue,
  CampaignValidationInput,
  CampaignValidationMode,
  CampaignValidationResult,
  CashFloorInput,
  CashFloorResolution,
} from './types/campaign.types';

/** Campaign kèm deliverables, cho màn khôi phục phiên làm việc. */
export interface CampaignDetail {
  campaign: Campaign;
  deliverables: CampaignDeliverable[];
}

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignDeliverable)
    private readonly deliverableRepository: Repository<CampaignDeliverable>,
    @Inject(REDIS_CLIENT)
    private readonly redis: RedisClientType,
  ) {}

  /** Mở lại bản nháp: campaign + deliverables theo đúng thứ tự position. */
  async findDetail(brandId: string, id: string): Promise<CampaignDetail> {
    const campaign = await this.campaignRepository.findOne({
      where: { id, brandId },
    });
    if (!campaign) {
      throw new NotFoundException('campaign does not exist');
    }

    return {
      campaign,
      deliverables: await this.deliverableRepository.find({
        where: { campaignId: id },
        order: { position: 'ASC' },
      }),
    };
  }

  async updateDraft(
    brandId: string,
    id: string,
    expectedVersion: number,
    dto: UpdateCampaignDto,
  ): Promise<Campaign> {
    // Đọc trước rồi mới ghi là an toàn ở đây vì câu UPDATE vẫn mang
    // `version = :expectedVersion`: có ai chen vào giữa thì affected = 0.
    const current = await this.campaignRepository.findOne({
      where: { id, brandId },
    });
    if (!current) {
      throw new NotFoundException('campaign does not exist');
    }
    await this.assertEditable(current);

    const patch = await this.toColumnPatch(dto);
    const merged = { ...current, ...patch };

    const result = await this.campaignRepository
      .createQueryBuilder()
      .update(Campaign)
      .set({
        ...patch,
        cashBudget: await this.computeCashBudget(merged),
        version: () => '"version" + 1',
      })
      .where(
        'id = :id AND brand_id = :brandId AND version = :expectedVersion',
        {
          id,
          brandId,
          expectedVersion,
        },
      )
      .execute();

    if (!result.affected) {
      throw this.versionConflict(current);
    }

    return this.campaignRepository.findOneByOrFail({ id });
  }

  async syncDeliverables(
    brandId: string,
    id: string,
    expectedVersion: number,
    items: DeliverableItemDto[],
  ): Promise<CampaignDeliverable[]> {
    const current = await this.campaignRepository.findOne({
      where: { id, brandId },
    });
    if (!current) {
      throw new NotFoundException('campaign does not exist');
    }
    await this.assertEditable(current);

    const bumped = await this.campaignRepository
      .createQueryBuilder()
      .update(Campaign)
      .set({ version: () => '"version" + 1' })
      .where(
        'id = :id AND brand_id = :brandId AND version = :expectedVersion',
        {
          id,
          brandId,
          expectedVersion,
        },
      )
      .execute();

    if (!bumped.affected) {
      throw this.versionConflict(current);
    }

    // Sinh id trước cho dòng mới để cả mảng đồng nhất cột, nhờ đó ghi được
    // bằng MỘT câu upsert.
    const rows = items.map((item, index) => ({
      ...item,
      id: item.id ?? uuidv7(),
      campaignId: id,
      position: index + 1,
      updatedAt: new Date(),
    }));

    // Xoá trước: DELETE chỉ bỏ bớt nên không thể tạo ra trùng position.
    const keptIds = rows.map((row) => row.id);
    await this.deliverableRepository
      .createQueryBuilder()
      .delete()
      .where('campaign_id = :id', { id })
      .andWhere('id NOT IN (:...keptIds)', { keptIds })
      .execute();
    if (rows.length) {
      await this.deliverableRepository.upsert(rows, { conflictPaths: ['id'] });
    }

    return this.deliverableRepository.find({
      where: { campaignId: id },
      order: { position: 'ASC' },
    });
  }

  // ------------------------------------------------------------- validation

  async validateCampaign(
    input: CampaignValidationInput,
    mode: CampaignValidationMode,
    now = new Date(),
  ): Promise<CampaignValidationResult> {
    const groups = await Promise.all([
      this.requiredFieldIssues(input),
      this.scheduleIssues(input, now),
      this.deliverableIssues(input),
      this.platformCoverageIssue(input),
      this.moneyIssues(input),
      this.categoryIssues(input),
    ]);
    const issues = groups.flat();

    return mode === 'submit'
      ? { errors: issues, warnings: [] }
      : { errors: [], warnings: issues };
  }

  /** Dò từ khoá riêng nhất tới `default`. Nhóm cấu hình do caller nạp sẵn. */
  // eslint-disable-next-line @typescript-eslint/require-await
  async resolveCashFloor(
    config: Record<string, unknown>,
    input: CashFloorInput,
  ): Promise<CashFloorResolution> {
    // PRODUCT không trả tiền mặt nên KHÔNG có sàn. Trả null chứ không phải 0.
    if (input.compensationType === ECompensationType.PRODUCT) {
      return { value: null, sourceKey: null };
    }

    const keys = this.cashFloorKeys(input);
    for (const key of keys) {
      const raw = config[key];
      if (raw === undefined || raw === null) {
        continue;
      }
      return { value: this.toFloorAmount(key, raw), sourceKey: key };
    }

    // Thiếu khoá là lỗi cấu hình, KHÔNG được im lặng bỏ qua sàn: BR-CAM-004 nói
    // không actor nào override được, mà bỏ qua vì thiếu config chính là override.
    throw new ServiceUnavailableException(
      `missing cash floor configuration, tried: ${keys.join(', ')}`,
    );
  }

  private cashFloorKeys(input: CashFloorInput): string[] {
    const { cashFloorPrefix, cashFloorDefault } = CAMPAIGN_CONFIG_KEY;
    const compensation = `${cashFloorPrefix}.${input.compensationType}`;

    return [
      input.platform && input.contentType
        ? `${compensation}.${input.platform}.${input.contentType}`
        : null,
      input.platform ? `${compensation}.${input.platform}` : null,
      compensation,
      cashFloorDefault,
    ].filter((key): key is string => key !== null);
  }

  /** Sàn phải là số nguyên không âm; sai kiểu thì hỏng to còn hơn bỏ qua. */
  private toFloorAmount(key: string, raw: unknown): bigint {
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0) {
      throw new ServiceUnavailableException(
        `configuration ${key} must be a non-negative integer, got ${JSON.stringify(raw)}`,
      );
    }
    return BigInt(raw);
  }

  private async requiredFieldIssues(
    input: CampaignValidationInput,
  ): Promise<CampaignIssue[]> {
    const { campaign, deliverables, assets, config } = input;
    const issues: CampaignIssue[] = [];

    // productDescription CHƯA kiểm: nó là rich text, chưa lưu được cho tới khi
    // T04 có sanitize, nên bắt buộc lúc này sẽ khoá cứng mọi lượt gửi duyệt.
    const always: [string, unknown][] = [
      ['title', campaign.title],
      ['objective', campaign.objective],
      ['categoryId', campaign.categoryId],
      ['keyMessage', campaign.keyMessage],
      ['sellingPoints', campaign.sellingPoints],
      ['prohibitedContent', campaign.prohibitedContent],
      ['creatorCount', campaign.creatorCount],
      ['recruitingStartAt', campaign.recruitingStartAt],
      ['applicationDeadline', campaign.applicationDeadline],
      ['compensationType', campaign.compensationType],
      ['pricingModel', campaign.pricingModel],
      ['usageRightsScope', campaign.usageRightsScope],
      ['usageRightsKind', campaign.usageRightsKind],
      ['cancellationPolicy', campaign.cancellationPolicy],
    ];
    for (const [fieldPath, value] of always) {
      if (this.isBlank(value)) issues.push(this.missing(fieldPath));
    }

    if (
      campaign.usageRightsKind === EUsageRightsKind.FIXED &&
      this.isBlank(campaign.usageRightsUntil)
    ) {
      issues.push(this.missing('usageRightsUntil'));
    }

    if (deliverables.length === 0) {
      issues.push(this.missing('deliverables'));
    }

    const images = assets.filter(
      (asset) => asset.kind === ECampaignAssetKind.PRODUCT_IMAGE,
    );
    const maxImages = this.readPositiveInt(
      config[CAMPAIGN_CONFIG_KEY.maxProductImages],
      MAX_PRODUCT_IMAGES_FALLBACK,
    );
    if (images.length === 0) {
      issues.push(this.missing('productImages'));
    } else if (images.length > maxImages) {
      issues.push({
        code: 'arrayMaxSize',
        fieldPath: 'productImages',
        message: `at most ${maxImages} product images allowed, got ${images.length}`,
        metadata: { max: maxImages, actual: images.length },
      });
    }

    return [...issues, ...(await this.compensationRequiredIssues(campaign))];
  }

  /** AC-BRA-006-6: PRODUCT không bắt buộc giá tiền mặt, nhưng phải có hiện vật. */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async compensationRequiredIssues(
    campaign: Campaign,
  ): Promise<CampaignIssue[]> {
    const issues: CampaignIssue[] = [];
    const { compensationType, pricingModel } = campaign;
    const hasCash =
      compensationType === ECompensationType.CASH ||
      compensationType === ECompensationType.HYBRID;
    const hasProduct =
      compensationType === ECompensationType.PRODUCT ||
      compensationType === ECompensationType.HYBRID;

    if (hasCash && pricingModel === EPricingModel.FIXED) {
      if (this.isBlank(campaign.cashUnitPrice)) {
        issues.push(this.missing('cashUnitPrice'));
      }
    }
    if (hasCash && pricingModel === EPricingModel.NEGOTIABLE) {
      if (this.isBlank(campaign.minCashUnitPrice)) {
        issues.push(this.missing('minCashUnitPrice'));
      }
      if (this.isBlank(campaign.maxCashUnitPrice)) {
        issues.push(this.missing('maxCashUnitPrice'));
      }
    }
    if (hasProduct && this.isBlank(campaign.productBenefit)) {
      issues.push(this.missing('productBenefit'));
    }

    return issues;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async scheduleIssues(
    input: CampaignValidationInput,
    now: Date,
  ): Promise<CampaignIssue[]> {
    const { recruitingStartAt, applicationDeadline } = input.campaign;
    const issues: CampaignIssue[] = [];

    if (recruitingStartAt && recruitingStartAt.getTime() < now.getTime()) {
      issues.push({
        code: 'minDate',
        fieldPath: 'recruitingStartAt',
        message: 'recruiting start must not be in the past',
      });
    }

    if (!applicationDeadline) return issues;

    const earliest =
      now.getTime() + MIN_HOURS_BEFORE_APPLICATION_DEADLINE * 60 * 60 * 1000;
    if (applicationDeadline.getTime() <= earliest) {
      issues.push({
        code: 'minDate',
        fieldPath: 'applicationDeadline',
        message: `application deadline must be at least ${MIN_HOURS_BEFORE_APPLICATION_DEADLINE} hours from now`,
        metadata: { minHours: MIN_HOURS_BEFORE_APPLICATION_DEADLINE },
      });
    }

    if (
      recruitingStartAt &&
      applicationDeadline.getTime() <= recruitingStartAt.getTime()
    ) {
      issues.push({
        code: 'minDate',
        fieldPath: 'applicationDeadline',
        message: 'application deadline must be after recruiting start',
      });
    }

    return issues;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async deliverableIssues(
    input: CampaignValidationInput,
  ): Promise<CampaignIssue[]> {
    const { applicationDeadline } = input.campaign;
    const issues: CampaignIssue[] = [];

    input.deliverables.forEach((deliverable, index) => {
      const path = `deliverables[${index}]`;
      for (const [field, value] of [
        ['contentType', deliverable.contentType],
        ['platform', deliverable.platform],
        ['quantity', deliverable.quantity],
        ['formatRequirements', deliverable.formatRequirements],
        ['contentSubmissionDeadline', deliverable.contentSubmissionDeadline],
        ['publishDeadline', deliverable.publishDeadline],
      ] as [string, unknown][]) {
        if (this.isBlank(value)) {
          issues.push(this.missing(`${path}.${field}`));
        }
      }

      const { platform, contentType } = deliverable;
      if (
        platform &&
        contentType &&
        !PLATFORM_CONTENT_TYPES[platform]?.includes(contentType)
      ) {
        issues.push({
          code: 'isEnum',
          fieldPath: `${path}.contentType`,
          message: `${platform} cannot publish ${contentType}`,
          metadata: { allowed: PLATFORM_CONTENT_TYPES[platform] },
        });
      }

      const submitBy = deliverable.contentSubmissionDeadline;
      const publishBy = deliverable.publishDeadline;

      if (
        submitBy &&
        applicationDeadline &&
        submitBy.getTime() <= applicationDeadline.getTime()
      ) {
        issues.push({
          code: 'minDate',
          fieldPath: `${path}.contentSubmissionDeadline`,
          message:
            'content submission deadline must be after the application deadline',
        });
      }

      if (submitBy && publishBy && publishBy.getTime() < submitBy.getTime()) {
        issues.push({
          code: 'minDate',
          fieldPath: `${path}.publishDeadline`,
          message:
            'publish deadline must not be earlier than the content submission deadline',
        });
      }
    });

    return issues;
  }

  /** BR-CAM-017: nơi công việc phải đăng luôn nằm trong tập nền tảng đã yêu cầu. */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async platformCoverageIssue(
    input: CampaignValidationInput,
  ): Promise<CampaignIssue[]> {
    const required = new Set(
      input.deliverables
        .map((deliverable) => deliverable.platform)
        .filter((platform): platform is ESocialPlatform => platform !== null),
    );
    const declared = new Set(input.campaign.creatorPlatforms ?? []);
    const uncovered = [...required].filter(
      (platform) => !declared.has(platform),
    );

    if (uncovered.length === 0) return [];

    return [
      {
        code: EBusinessCode[EBusinessCode.CAMPAIGN_PLATFORM_MISMATCH],
        fieldPath: 'creatorPlatforms',
        message: `deliverables publish on ${uncovered.join(', ')} but creatorPlatforms does not list them`,
        metadata: { uncovered },
      },
    ];
  }

  private async moneyIssues(
    input: CampaignValidationInput,
  ): Promise<CampaignIssue[]> {
    const { campaign, config } = input;
    const { compensationType, pricingModel } = campaign;
    if (!compensationType || !pricingModel) return [];

    const issues: CampaignIssue[] = [];
    const min = this.toBigInt(campaign.minCashUnitPrice);
    const max = this.toBigInt(campaign.maxCashUnitPrice);
    const unit = this.toBigInt(campaign.cashUnitPrice);

    if (min !== null && max !== null && max < min) {
      issues.push({
        code: EBusinessCode[EBusinessCode.CAMPAIGN_PRICE_RANGE_INVALID],
        fieldPath: 'maxCashUnitPrice',
        message: 'maximum price must not be lower than the minimum price',
      });
    }

    // cash_budget là cột dẫn xuất; lệch công thức nghĩa là có đường ghi nào đó
    // đã bỏ qua service.
    if (pricingModel === EPricingModel.FIXED && unit !== null) {
      const expected =
        campaign.creatorCount === null
          ? null
          : BigInt(campaign.creatorCount) * unit;
      const actual = this.toBigInt(campaign.cashBudget);
      if (expected !== null && actual !== expected) {
        issues.push({
          code: EBusinessCode[EBusinessCode.CAMPAIGN_BUDGET_MISMATCH],
          fieldPath: 'cashBudget',
          message: `budget must equal ${campaign.creatorCount} × ${unit}`,
          metadata: { expected: expected.toString() },
        });
      }
    }

    // §5.5: FIXED so cash_unit_price, NEGOTIABLE so min. max không bị ràng trên.
    const compared =
      pricingModel === EPricingModel.FIXED
        ? { value: unit, fieldPath: 'cashUnitPrice' }
        : { value: min, fieldPath: 'minCashUnitPrice' };

    if (compared.value !== null) {
      const floor = await this.resolveCashFloor(config, { compensationType });
      if (floor.value !== null && compared.value < floor.value) {
        issues.push({
          code: EBusinessCode[EBusinessCode.CAMPAIGN_CASH_BELOW_FLOOR],
          fieldPath: compared.fieldPath,
          message: `${compared.value} is below the floor of ${floor.value}`,
          // sourceKey là thứ khiến thông báo giải thích được: brand thấy ngay
          // con số đó đến từ quy tắc nào.
          metadata: {
            floor: floor.value.toString(),
            sourceKey: floor.sourceKey,
          },
        });
      }
    }

    return issues;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async categoryIssues(
    input: CampaignValidationInput,
  ): Promise<CampaignIssue[]> {
    const { campaign, category } = input;
    if (!campaign.categoryId) return [];

    if (!category || !category.isActive) {
      return [
        {
          code: EBusinessCode[EBusinessCode.CAMPAIGN_CATEGORY_PROHIBITED],
          fieldPath: 'categoryId',
          message: 'category does not exist or is no longer active',
        },
      ];
    }

    // RESTRICTED KHÔNG chặn (BR-CAM-005): nó chỉ thêm mục cho checklist thủ công
    // của admin ở T09.
    if (category.policy === ECategoryPolicy.PROHIBITED) {
      return [
        {
          code: EBusinessCode[EBusinessCode.CAMPAIGN_CATEGORY_PROHIBITED],
          fieldPath: 'categoryId',
          message: 'this category is prohibited for campaigns',
        },
      ];
    }

    return [];
  }

  private isBlank(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  private missing(fieldPath: string): CampaignIssue {
    return {
      code: 'isNotEmpty',
      fieldPath,
      message: `${fieldPath} is required to submit for review`,
    };
  }

  /** Cột bigint đọc ra là chuỗi, so sánh số phải ép qua BigInt. */
  private toBigInt(value: string | null): bigint | null {
    return value === null || value === undefined ? null : BigInt(value);
  }

  private readPositiveInt(raw: unknown, fallback: number): number {
    return typeof raw === 'number' && Number.isInteger(raw) && raw > 0
      ? raw
      : fallback;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async assertEditable(campaign: Campaign): Promise<void> {
    if (EDITABLE_CAMPAIGN_STATUSES.includes(campaign.status)) {
      return;
    }
    throw new UnprocessableEntityException({
      businessCode: EBusinessCode.CAMPAIGN_INVALID_TRANSITION,
      message: `campaign is ${CAMPAIGN_STATUS_LABEL[campaign.status]} and cannot be edited`,
      status: campaign.status,
      version: campaign.version,
    });
  }

  private versionConflict(current: Campaign): ConflictException {
    return new ConflictException({
      businessCode: EBusinessCode.CAMPAIGN_VERSION_CONFLICT,
      message: 'campaign was modified by another operation',
      status: current.status,
      version: current.version,
    });
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  private async computeCashBudget(campaign: Campaign): Promise<string | null> {
    if (
      campaign.pricingModel !== EPricingModel.FIXED ||
      campaign.creatorCount == null ||
      campaign.cashUnitPrice == null
    ) {
      return null;
    }
    return (
      BigInt(campaign.creatorCount) * BigInt(campaign.cashUnitPrice)
    ).toString();
  }

  /** DTO nhận tiền dạng number cho tiện client; cột là bigint nên lưu string. */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async toColumnPatch(
    dto: UpdateCampaignDto,
  ): Promise<Partial<Campaign>> {
    const { cashUnitPrice, minCashUnitPrice, maxCashUnitPrice, ...rest } = dto;
    const patch: Record<string, unknown> = { ...rest };

    for (const [key, value] of Object.entries({
      cashUnitPrice,
      minCashUnitPrice,
      maxCashUnitPrice,
    })) {
      if (value !== undefined) {
        patch[key] = value === null ? null : String(value);
      }
    }

    return patch;
  }

  private async findByIdempotencyKey(
    brandId: string,
    key?: string,
  ): Promise<Campaign | null> {
    if (!key) {
      return null;
    }

    let campaignId: string | null;
    try {
      campaignId = await this.redis.get(
        redisKeys.campaignIdempotency(brandId, key),
      );
    } catch (error) {
      // Redis hỏng thì mất khả năng khử trùng, nhưng không được vì thế mà
      // không tạo được campaign.
      this.logger.warn(`đọc idempotency key hỏng: ${(error as Error).message}`);
      return null;
    }

    if (!campaignId) {
      return null;
    }

    // Vẫn ràng brandId: key nằm trong không gian của brand nhưng đọc campaign
    // thì không được tin mỗi id.
    return this.campaignRepository.findOne({
      where: { id: campaignId, brandId },
    });
  }

  async createCampaign(
    brandId: string,
    idempotencyKey?: string,
  ): Promise<Campaign> {
    const replayed = await this.findByIdempotencyKey(brandId, idempotencyKey);
    if (replayed) {
      return replayed;
    }

    await this.assertUnderLimit(brandId);

    const campaign = await this.insertWithUniqueCode(brandId);
    await this.rememberIdempotencyKey(brandId, idempotencyKey, campaign.id);

    return campaign;
  }

  private async rememberIdempotencyKey(
    brandId: string,
    key: string | undefined,
    campaignId: string,
  ): Promise<void> {
    if (!key) {
      return;
    }

    try {
      await this.redis.set(
        redisKeys.campaignIdempotency(brandId, key),
        campaignId,
        { EX: CAMPAIGN_IDEMPOTENCY_TTL_SECONDS },
      );
    } catch (error) {
      this.logger.warn(`ghi idempotency key hỏng: ${(error as Error).message}`);
    }
  }

  private async assertUnderLimit(brandId: string): Promise<void> {
    const unfinished = await this.campaignRepository.count({
      where: { brandId, status: In(UNFINISHED_CAMPAIGN_STATUSES) },
    });

    if (unfinished >= MAX_UNFINISHED_CAMPAIGNS_PER_BRAND) {
      throw new UnprocessableEntityException({
        businessCode: EBusinessCode.CAMPAIGN_LIMIT_REACHED,
        message:
          `${unfinished} unfinished campaigns already, limit is ` +
          `${MAX_UNFINISHED_CAMPAIGNS_PER_BRAND}; finish or cancel some first`,
      });
    }
  }

  private async insertWithUniqueCode(brandId: string): Promise<Campaign> {
    for (let attempt = 1; attempt <= CAMPAIGN_CODE_MAX_ATTEMPTS; attempt++) {
      try {
        return await this.campaignRepository.save(
          this.campaignRepository.create({
            brandId,
            code: await this.generateCode(),
          }),
        );
      } catch (error) {
        if (uniqueViolationOf(error) !== 'UQ_campaigns_code') {
          throw error;
        }
        this.logger.warn(`mã campaign đụng nhau, thử lại lần ${attempt + 1}`);
      }
    }

    throw new ServiceUnavailableException('could not generate a campaign code');
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async generateCode(): Promise<string> {
    const bytes = randomBytes(CAMPAIGN_CODE_LENGTH);
    let code = '';
    for (const byte of bytes) {
      code += CAMPAIGN_CODE_ALPHABET[byte % CAMPAIGN_CODE_ALPHABET.length];
    }
    return `${CAMPAIGN_CODE_PREFIX}${code}`;
  }
}
