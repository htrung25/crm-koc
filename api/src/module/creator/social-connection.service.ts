import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '../../infra/redis.module';
import { ESocialPlatform } from '../../common/enum/social-platform.enum';
import { uniqueViolationOf } from '../../common/util/pg-error.util';
import { SocialAccount } from './entities/social-account.entity';
import { SocialProviderService } from './social-provider.service';
import { SocialTokenService } from './social-token.service';
import {
  CreateAuthorizationUrlInput,
  HandleCallbackInput,
  NormalizedSocialProfile,
  OAuthStatePayload,
} from './types/social.types';

const STATE_TTL_SECONDS = 10 * 60;

/** Tên index đúng như migration đặt; đổi ở đó phải sửa cả ở đây. */
const EXTERNAL_ID_INDEX = 'uq_social_accounts_platform_external_id';

/**
 * Cột được phép ra khỏi service. Entity còn accessTokenEncrypted,
 * refreshTokenEncrypted, rawData, creatorProfileId — không cột nào được lọt ra API.
 */
const CONNECTION_COLUMNS = {
  id: true,
  platform: true,
  externalAccountId: true,
  username: true,
  displayName: true,
  biography: true,
  profileUrl: true,
  avatarUrl: true,
  followerCount: true,
  followingCount: true,
  contentCount: true,
  grantedScopes: true,
  tokenExpiresAt: true,
  lastSyncedAt: true,
  syncError: true,
  isActive: true,
  createdAt: true,
} as const;

export type SocialConnection = Pick<
  SocialAccount,
  keyof typeof CONNECTION_COLUMNS
>;

@Injectable()
export class SocialConnectionsService {
  private readonly logger = new Logger(SocialConnectionsService.name);
  private readonly callbackBaseUrl: string;

  constructor(
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
    private readonly providerService: SocialProviderService,
    private readonly tokenService: SocialTokenService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT)
    private readonly redis: RedisClientType,
  ) {
    // redirect_uri phải trỏ về FRONTEND, không phải API: nền tảng chuyển hướng
    // trình duyệt tới đó, mà trình duyệt không mang theo bearer token. Trang
    // frontend nhận code+state rồi mới gọi API kèm token.
    this.callbackBaseUrl = this.configService.getOrThrow<string>(
      'SOCIAL_OAUTH_CALLBACK_BASE_URL',
    );
  }

  private stateKey(state: string): string {
    return `social-oauth:state:${state}`;
  }

  private redirectUriFor(platform: ESocialPlatform): string {
    return `${this.callbackBaseUrl.replace(/\/+$/, '')}/${platform}`;
  }

  async createAuthorizationUrl(
    input: CreateAuthorizationUrlInput,
  ): Promise<{ authorizationUrl: string }> {
    const provider = this.providerService.getProvider(input.platform);

    // randomBytes chứ không phải Math.random: state là thứ duy nhất buộc lần
    // chuyển hướng đi và lần quay về là cùng một phiên.
    const state = randomBytes(32).toString('base64url');
    const redirectUri = this.redirectUriFor(input.platform);

    const payload: OAuthStatePayload = {
      creatorProfileId: input.creatorProfileId,
      platform: input.platform,
      redirectUri,
    };

    await this.redis.set(this.stateKey(state), JSON.stringify(payload), {
      EX: STATE_TTL_SECONDS,
    });

    return {
      authorizationUrl: provider.createAuthorizationUrl({ state, redirectUri }),
    };
  }

  /**
   * Bước 2: đổi code lấy token, lấy hồ sơ, lưu kết nối.
   */
  async handleCallback(input: HandleCallbackInput): Promise<SocialConnection> {
    if (!input.code || !input.state) {
      throw new BadRequestException('INVALID_SOCIAL_CALLBACK');
    }

    const key = this.stateKey(input.state);
    const serialized = await this.redis.get(key);
    if (!serialized) {
      throw new UnauthorizedException('OAUTH_STATE_EXPIRED_OR_INVALID');
    }
    // Xoá ngay: state dùng một lần, giữ lại là mở đường replay.
    await this.redis.del(key);

    const state = JSON.parse(serialized) as OAuthStatePayload;

    if (state.platform !== input.platform) {
      throw new UnauthorizedException('OAUTH_PLATFORM_MISMATCH');
    }

    // Người đang đăng nhập phải đúng là người đã khởi tạo luồng. Nếu không,
    // một creator có thể hoàn tất luồng do creator khác mở.
    if (state.creatorProfileId !== input.currentAccountId) {
      this.logger.warn(
        `OAuth state của ${state.creatorProfileId} bị dùng bởi ${input.currentAccountId}`,
      );
      throw new ForbiddenException('OAUTH_STATE_OWNER_MISMATCH');
    }

    const provider = this.providerService.getProvider(input.platform);

    const tokens = await provider.exchangeAuthorizationCode({
      code: input.code,
      redirectUri: state.redirectUri,
    });

    const profile = await provider.getProfile(tokens.accessToken);

    // AAD buộc ciphertext vào đúng tài khoản: chép sang dòng khác sẽ không
    // giải mã được.
    const aad = SocialTokenService.aadFor(
      input.platform,
      profile.externalAccountId,
    );

    const saved = await this.upsertConnection({
      creatorProfileId: state.creatorProfileId,
      platform: input.platform,
      profile,
      accessTokenEncrypted: this.tokenService.encrypt(tokens.accessToken, aad),
      refreshTokenEncrypted: tokens.refreshToken
        ? this.tokenService.encrypt(tokens.refreshToken, aad)
        : null,
      tokenExpiresAt: tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : null,
      grantedScopes: tokens.scopes ?? [],
    });

    // save() trả entity đầy đủ, kể cả token vừa mã hoá. Đọc lại theo cột.
    return this.socialAccountRepository.findOneOrFail({
      where: { id: saved.id },
      select: CONNECTION_COLUMNS,
    });
  }

  findByCreator(creatorProfileId: string): Promise<SocialConnection[]> {
    return this.socialAccountRepository.find({
      where: { creatorProfileId },
      order: { platform: 'ASC' },
      select: CONNECTION_COLUMNS,
    });
  }

  async disconnect(
    creatorProfileId: string,
    platform: ESocialPlatform,
  ): Promise<void> {
    // Điều kiện gồm cả creatorProfileId: không cho xoá kết nối của người khác
    // dù biết id.
    const result = await this.socialAccountRepository.delete({
      creatorProfileId,
      platform,
    });

    if (!result.affected) {
      throw new BadRequestException('SOCIAL_CONNECTION_NOT_FOUND');
    }
  }

  private async upsertConnection(input: {
    creatorProfileId: string;
    platform: ESocialPlatform;
    profile: NormalizedSocialProfile;
    accessTokenEncrypted: string;
    refreshTokenEncrypted: string | null;
    tokenExpiresAt: Date | null;
    grantedScopes: string[];
  }): Promise<SocialAccount> {
    try {
      await this.socialAccountRepository.upsert(
        {
          creatorProfileId: input.creatorProfileId,
          platform: input.platform,
          externalAccountId: input.profile.externalAccountId,
          username: input.profile.username,
          displayName: input.profile.displayName,
          biography: input.profile.biography,
          profileUrl: input.profile.profileUrl,
          avatarUrl: input.profile.avatarUrl,
          followerCount: String(input.profile.followerCount),
          followingCount: String(input.profile.followingCount),
          contentCount: String(input.profile.contentCount),
          accessTokenEncrypted: input.accessTokenEncrypted,
          refreshTokenEncrypted: input.refreshTokenEncrypted,
          tokenExpiresAt: input.tokenExpiresAt,
          grantedScopes: input.grantedScopes,
          // Cột jsonb khai Record<string, unknown> không tương thích với
          // QueryDeepPartialEntity mà upsert() nhận — cùng vấn đề đã gặp ở
          // SessionEventService. Ép kiểu tại đúng một field thay vì đổi cả
          // kiểu cột.
          rawData: (input.profile.rawData ?? null) as never,
          lastSyncedAt: new Date(),
          syncError: null,
          isActive: true,
        },
        { conflictPaths: ['creatorProfileId', 'platform'] },
      );
    } catch (error) {
      if (uniqueViolationOf(error) === EXTERNAL_ID_INDEX) {
        throw new ConflictException('SOCIAL_ACCOUNT_ALREADY_CONNECTED');
      }
      throw error;
    }

    return this.socialAccountRepository.findOneByOrFail({
      creatorProfileId: input.creatorProfileId,
      platform: input.platform,
    });
  }
}
