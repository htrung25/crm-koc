import { randomBytes } from 'node:crypto';
import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { RedisClientType } from 'redis';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import { REDIS_CLIENT, redisKeys } from '../../infra/redis.module';
import { uniqueViolationOf } from '../../common/util/pg-error.util';
import {
  CAMPAIGN_CODE_ALPHABET,
  CAMPAIGN_CODE_LENGTH,
  CAMPAIGN_CODE_MAX_ATTEMPTS,
  CAMPAIGN_CODE_PREFIX,
  CAMPAIGN_IDEMPOTENCY_TTL_SECONDS,
  MAX_UNFINISHED_CAMPAIGNS_PER_BRAND,
  UNFINISHED_CAMPAIGN_STATUSES,
} from './constants/campaign.constants';
import { Campaign } from './entities/campaign.entity';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @Inject(REDIS_CLIENT)
    private readonly redis: RedisClientType,
  ) {}

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
          `đã có ${unfinished} campaign chưa kết thúc, tối đa ` +
          `${MAX_UNFINISHED_CAMPAIGNS_PER_BRAND}; hoàn tất hoặc huỷ bớt trước`,
      });
    }
  }

  private async insertWithUniqueCode(brandId: string): Promise<Campaign> {
    for (let attempt = 1; attempt <= CAMPAIGN_CODE_MAX_ATTEMPTS; attempt++) {
      try {
        return await this.campaignRepository.save(
          this.campaignRepository.create({
            brandId,
            code: this.generateCode(),
          }),
        );
      } catch (error) {
        if (uniqueViolationOf(error) !== 'UQ_campaigns_code') {
          throw error;
        }
        this.logger.warn(`mã campaign đụng nhau, thử lại lần ${attempt + 1}`);
      }
    }

    throw new ServiceUnavailableException('không sinh được mã campaign');
  }

  private generateCode(): string {
    const bytes = randomBytes(CAMPAIGN_CODE_LENGTH);
    let code = '';
    for (const byte of bytes) {
      code += CAMPAIGN_CODE_ALPHABET[byte % CAMPAIGN_CODE_ALPHABET.length];
    }
    return `${CAMPAIGN_CODE_PREFIX}${code}`;
  }
}
