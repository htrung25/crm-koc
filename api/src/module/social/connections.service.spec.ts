import { ConfigService } from '@nestjs/config';
import { QueryFailedError, Repository } from 'typeorm';
import type { RedisClientType } from 'redis';
import { ESocialPlatform } from '../../common/enum/social-platform.enum';
import { SocialConnectionsService } from './connections.service';
import { SocialAccountEntity } from './entities/social-account.entity';
import { SocialProviderService } from './provider.service';
import { SocialTokenService } from './token.service';
import { NormalizedSocialProfile, SocialProvider } from './types/social.types';

const CREATOR = 'creator-uuid-1';
const OTHER_CREATOR = 'creator-uuid-2';
const CALLBACK_BASE = 'https://app.test/social/callback';

const PROFILE: NormalizedSocialProfile = {
  platform: ESocialPlatform.TIKTOK,
  externalAccountId: 'open-1',
  username: 'koc_one',
  displayName: 'KOC One',
  biography: null,
  avatarUrl: null,
  profileUrl: null,
  followerCount: 10,
  followingCount: 2,
  contentCount: 5,
};

function uniqueViolation(constraint: string): QueryFailedError {
  const error = new QueryFailedError('SQL', [], new Error('dup'));
  Object.assign(error, { code: '23505', constraint });
  return error;
}

describe('SocialConnectionsService', () => {
  let repository: jest.Mocked<Repository<SocialAccountEntity>>;
  let redis: jest.Mocked<RedisClientType>;
  let provider: jest.Mocked<SocialProvider>;
  let service: SocialConnectionsService;
  // Giu tham chieu roi: expect(obj.method) vi pham unbound-method
  let exchangeMock: jest.Mock;
  let findMock: jest.Mock;
  let deleteMock: jest.Mock;

  beforeEach(() => {
    findMock = jest.fn().mockResolvedValue([]);
    deleteMock = jest.fn().mockResolvedValue({ affected: 1 });
    repository = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findOneByOrFail: jest.fn().mockResolvedValue({ id: 'row-1' }),
      find: findMock,
      delete: deleteMock,
    } as unknown as jest.Mocked<Repository<SocialAccountEntity>>;

    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<RedisClientType>;

    exchangeMock = jest.fn().mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 60,
    });
    provider = {
      createAuthorizationUrl: jest.fn().mockReturnValue('https://tiktok/auth'),
      exchangeAuthorizationCode: exchangeMock,
      getProfile: jest.fn().mockResolvedValue(PROFILE),
      refreshAccessToken: jest.fn(),
    };

    const providerService = {
      getProvider: jest.fn().mockReturnValue(provider),
    } as unknown as SocialProviderService;

    const tokenService = {
      encrypt: jest.fn((value: string) => `enc(${value})`),
    } as unknown as SocialTokenService;

    const config = {
      getOrThrow: jest.fn().mockReturnValue(CALLBACK_BASE),
    } as unknown as ConfigService;

    service = new SocialConnectionsService(
      repository,
      providerService,
      tokenService,
      config,
      redis,
    );
  });

  describe('createAuthorizationUrl', () => {
    it('cất creatorProfileId vào Redis kèm TTL, KHÔNG nhét vào chuỗi state', async () => {
      await service.createAuthorizationUrl({
        creatorProfileId: CREATOR,
        platform: ESocialPlatform.TIKTOK,
      });

      const [key, payload, options] = redis.set.mock.calls[0];
      expect(key).toMatch(/^social-oauth:state:/);
      expect(JSON.parse(payload as string)).toEqual({
        creatorProfileId: CREATOR,
        platform: ESocialPlatform.TIKTOK,
        redirectUri: `${CALLBACK_BASE}/tiktok`,
      });
      expect(options).toEqual({ EX: 600 });

      // state chỉ là khoá tra cứu: không được mang thông tin creator
      const state = (key as string).replace('social-oauth:state:', '');
      expect(state).not.toContain(CREATOR);
    });

    it('mỗi lần gọi sinh state khác nhau', async () => {
      await service.createAuthorizationUrl({
        creatorProfileId: CREATOR,
        platform: ESocialPlatform.TIKTOK,
      });
      await service.createAuthorizationUrl({
        creatorProfileId: CREATOR,
        platform: ESocialPlatform.TIKTOK,
      });

      expect(redis.set.mock.calls[0][0]).not.toBe(redis.set.mock.calls[1][0]);
    });
  });

  describe('handleCallback', () => {
    const validState = JSON.stringify({
      creatorProfileId: CREATOR,
      platform: ESocialPlatform.TIKTOK,
      redirectUri: `${CALLBACK_BASE}/tiktok`,
    });

    const callback = (overrides: Record<string, string> = {}) =>
      service.handleCallback({
        platform: ESocialPlatform.TIKTOK,
        code: 'code-1',
        state: 'state-1',
        currentAccountId: CREATOR,
        ...overrides,
      });

    it('từ chối khi thiếu code hoặc state', async () => {
      await expect(callback({ code: '' })).rejects.toThrow(
        'INVALID_SOCIAL_CALLBACK',
      );
      expect(redis.get).not.toHaveBeenCalled();
    });

    it('từ chối khi state không còn trong Redis', async () => {
      redis.get.mockResolvedValue(null);
      await expect(callback()).rejects.toThrow(
        'OAUTH_STATE_EXPIRED_OR_INVALID',
      );
    });

    it('xoá state ngay sau khi đọc — dùng một lần, chặn replay', async () => {
      redis.get.mockResolvedValue(validState);
      await callback();
      expect(redis.del).toHaveBeenCalledWith('social-oauth:state:state-1');
    });

    it('từ chối khi nền tảng trong state khác nền tảng của callback', async () => {
      redis.get.mockResolvedValue(
        JSON.stringify({
          creatorProfileId: CREATOR,
          platform: ESocialPlatform.YOUTUBE,
          redirectUri: 'x',
        }),
      );
      await expect(callback()).rejects.toThrow('OAUTH_PLATFORM_MISMATCH');
    });

    it('TỪ CHỐI khi người đang đăng nhập không phải người mở luồng', async () => {
      redis.get.mockResolvedValue(validState);
      await expect(
        callback({ currentAccountId: OTHER_CREATOR }),
      ).rejects.toThrow('OAUTH_STATE_OWNER_MISMATCH');

      // Không được đi tiếp tới bước đổi token
      expect(exchangeMock).not.toHaveBeenCalled();
    });

    it('dùng redirectUri từ Redis, không phải từ input của client', async () => {
      redis.get.mockResolvedValue(validState);
      await callback();
      expect(exchangeMock).toHaveBeenCalledWith({
        code: 'code-1',
        redirectUri: `${CALLBACK_BASE}/tiktok`,
      });
    });

    it('mã hoá cả access token lẫn refresh token trước khi lưu', async () => {
      redis.get.mockResolvedValue(validState);
      await callback();

      const saved = repository.upsert.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(saved.accessTokenEncrypted).toBe('enc(at)');
      expect(saved.refreshTokenEncrypted).toBe('enc(rt)');
      expect(JSON.stringify(saved)).not.toContain('"at"');
    });

    it('upsert theo (creatorProfileId, platform) — nối lại là cập nhật', async () => {
      redis.get.mockResolvedValue(validState);
      await callback();
      expect(repository.upsert.mock.calls[0][1]).toEqual({
        conflictPaths: ['creatorProfileId', 'platform'],
      });
    });

    it('dịch trùng external id thành 409, KHÔNG để lỗi Postgres lên tới client', async () => {
      redis.get.mockResolvedValue(validState);
      repository.upsert.mockRejectedValue(
        uniqueViolation('uq_social_accounts_platform_external_id'),
      );

      await expect(callback()).rejects.toThrow(
        'SOCIAL_ACCOUNT_ALREADY_CONNECTED',
      );
    });

    it('KHÔNG nuốt các lỗi unique khác — chỉ dịch đúng constraint đã biết', async () => {
      redis.get.mockResolvedValue(validState);
      repository.upsert.mockRejectedValue(uniqueViolation('UQ_khac'));

      await expect(callback()).rejects.toThrow(QueryFailedError);
    });

    it('không kiểm tra trước bằng find — để DB làm trọng tài', async () => {
      redis.get.mockResolvedValue(validState);
      await callback();
      expect(findMock).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('điều kiện xoá gồm cả creator — không xoá được của người khác', async () => {
      await service.disconnect(CREATOR, ESocialPlatform.TIKTOK);
      expect(deleteMock).toHaveBeenCalledWith({
        creatorProfileId: CREATOR,
        platform: ESocialPlatform.TIKTOK,
      });
    });

    it('báo lỗi khi không xoá được dòng nào', async () => {
      deleteMock.mockResolvedValue({ affected: 0, raw: [] });
      await expect(
        service.disconnect(CREATOR, ESocialPlatform.TIKTOK),
      ).rejects.toThrow('SOCIAL_CONNECTION_NOT_FOUND');
    });
  });
});
