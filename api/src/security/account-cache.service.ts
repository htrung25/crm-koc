import { Inject, Injectable, Logger } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT, redisKeys } from '../infra/redis.module';
import { AuthenticatedAccount } from '../module/auth/types/authenticated.types';

/** TTL ngắn: cache chỉ để giảm tải DB, không phải nguồn dữ liệu chính. */
const ACCOUNT_TTL_SECONDS = 300;

@Injectable()
export class AccountCacheService {
  private readonly logger = new Logger(AccountCacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {}

  /**
   * Redis hỏng thì trả null để caller rơi về DB, không làm chết request.
   * Cache là tối ưu hoá, không được trở thành điểm chết của hệ thống.
   */
  async get(id: string): Promise<AuthenticatedAccount | null> {
    try {
      const raw = await this.redis.get(redisKeys.account(id));
      if (!raw) return null;

      const parsed = JSON.parse(raw) as AuthenticatedAccount;
      // JSON.parse trả string cho các cột ngày => khôi phục lại Date
      parsed.createdAt = new Date(parsed.createdAt);
      parsed.updatedAt = new Date(parsed.updatedAt);
      return parsed;
    } catch (error) {
      this.logger.warn(`cache get failed: ${(error as Error).message}`);
      return null;
    }
  }

  async set(account: AuthenticatedAccount): Promise<void> {
    try {
      // node-redis: option dạng object { EX: seconds }
      await this.redis.set(
        redisKeys.account(account.id),
        JSON.stringify(account),
        { EX: ACCOUNT_TTL_SECONDS },
      );
    } catch (error) {
      this.logger.warn(`cache set failed: ${(error as Error).message}`);
    }
  }

  async invalidate(id: string): Promise<void> {
    await this.redis.del(redisKeys.account(id));
  }
}
