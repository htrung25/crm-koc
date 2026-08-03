import { ConfigService } from '@nestjs/config';
import { ESocialPlatform } from '../../common/enum/social-platform.enum';
import { TikTokService } from './tiktok.service';

const CLIENT_KEY = 'test-client-key';
const CLIENT_SECRET = 'test-client-secret';

function makeService(): TikTokService {
  const config = {
    getOrThrow: jest.fn((key: string) =>
      key === 'TIKTOK_CLIENT_KEY' ? CLIENT_KEY : CLIENT_SECRET,
    ),
  } as unknown as ConfigService;
  return new TikTokService(config);
}

function mockFetch(ok: boolean, payload: unknown): jest.Mock {
  const fn = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(payload),
  });
  global.fetch = fn;
  return fn;
}

/** Body của lần fetch gần nhất, đã parse thành cặp key/value. */
function lastBody(fn: jest.Mock): Record<string, string> {
  const [, init] = fn.mock.calls[0] as [string, { body: URLSearchParams }];
  return Object.fromEntries(init.body.entries());
}

describe('TikTokService', () => {
  let service: TikTokService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = makeService();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('createAuthorizationUrl', () => {
    it('dựng URL đủ tham số bắt buộc', () => {
      const url = new URL(
        service.createAuthorizationUrl({
          state: 'state-123',
          redirectUri: 'https://app.test/cb/tiktok',
        }),
      );

      expect(url.origin + url.pathname).toBe(
        'https://www.tiktok.com/v2/auth/authorize/',
      );
      expect(url.searchParams.get('client_key')).toBe(CLIENT_KEY);
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('state')).toBe('state-123');
      expect(url.searchParams.get('redirect_uri')).toBe(
        'https://app.test/cb/tiktok',
      );
    });

    it('xin scope user.info.profile — thiếu nó thì không có username thật', () => {
      const url = new URL(
        service.createAuthorizationUrl({ state: 's', redirectUri: 'r' }),
      );
      expect(url.searchParams.get('scope')).toContain('user.info.profile');
    });

    it('KHÔNG để lộ client_secret ra URL chuyển hướng', () => {
      const url = service.createAuthorizationUrl({
        state: 's',
        redirectUri: 'r',
      });
      expect(url).not.toContain(CLIENT_SECRET);
    });
  });

  describe('exchangeAuthorizationCode', () => {
    it('gửi grant_type=authorization_code kèm secret và map kết quả', async () => {
      const fn = mockFetch(true, {
        access_token: 'at-1',
        refresh_token: 'rt-1',
        expires_in: 86400,
        scope: 'user.info.basic,user.info.stats',
      });

      const tokens = await service.exchangeAuthorizationCode({
        code: 'code-1',
        redirectUri: 'https://app.test/cb/tiktok',
      });

      expect(lastBody(fn)).toMatchObject({
        grant_type: 'authorization_code',
        code: 'code-1',
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        redirect_uri: 'https://app.test/cb/tiktok',
      });
      expect(tokens).toEqual({
        accessToken: 'at-1',
        refreshToken: 'rt-1',
        expiresIn: 86400,
        scopes: ['user.info.basic', 'user.info.stats'],
      });
    });

    it('ném lỗi khi TikTok trả HTTP lỗi', async () => {
      mockFetch(false, {});
      await expect(
        service.exchangeAuthorizationCode({ code: 'c', redirectUri: 'r' }),
      ).rejects.toThrow('TIKTOK_TOKEN_EXCHANGE_FAILED');
    });

    it('ném lỗi khi 200 nhưng thiếu access_token', async () => {
      mockFetch(true, { refresh_token: 'rt' });
      await expect(
        service.exchangeAuthorizationCode({ code: 'c', redirectUri: 'r' }),
      ).rejects.toThrow('TIKTOK_ACCESS_TOKEN_MISSING');
    });

    it('scopes rỗng khi TikTok không trả scope', async () => {
      mockFetch(true, { access_token: 'at' });
      const tokens = await service.exchangeAuthorizationCode({
        code: 'c',
        redirectUri: 'r',
      });
      expect(tokens.scopes).toEqual([]);
    });
  });

  describe('refreshAccessToken', () => {
    it('gửi grant_type=refresh_token, KHÔNG gửi code', async () => {
      const fn = mockFetch(true, {
        access_token: 'at-2',
        refresh_token: 'rt-2',
      });

      const tokens = await service.refreshAccessToken('rt-1');

      const body = lastBody(fn);
      expect(body.grant_type).toBe('refresh_token');
      expect(body.refresh_token).toBe('rt-1');
      expect(body).not.toHaveProperty('code');
      expect(tokens.accessToken).toBe('at-2');
    });

    it('ném lỗi riêng khi refresh hỏng', async () => {
      mockFetch(false, {});
      await expect(service.refreshAccessToken('rt')).rejects.toThrow(
        'TIKTOK_TOKEN_REFRESH_FAILED',
      );
    });
  });

  describe('getProfile', () => {
    const fullUser = {
      open_id: 'open-1',
      username: 'koc_one',
      display_name: 'KOC One',
      avatar_url: 'https://cdn/a.png',
      bio_description: 'xin chao',
      profile_deep_link: 'https://tiktok.com/@koc_one',
      follower_count: 1000,
      following_count: 50,
      video_count: 20,
    };

    it('chuẩn hoá về NormalizedSocialProfile', async () => {
      mockFetch(true, { data: { user: fullUser } });

      const profile = await service.getProfile('at');

      expect(profile).toMatchObject({
        platform: ESocialPlatform.TIKTOK,
        externalAccountId: 'open-1',
        username: 'koc_one',
        displayName: 'KOC One',
        biography: 'xin chao',
        followerCount: 1000,
        followingCount: 50,
        contentCount: 20,
      });
    });

    it('giữ payload gốc vào rawData để truy ngược', async () => {
      mockFetch(true, { data: { user: fullUser } });
      const profile = await service.getProfile('at');
      expect(profile.rawData).toEqual({ data: { user: fullUser } });
    });

    it('gửi access token qua header Authorization', async () => {
      const fn = mockFetch(true, { data: { user: fullUser } });
      await service.getProfile('at-xyz');
      const [, init] = fn.mock.calls[0] as [
        string,
        { headers: Record<string, string> },
      ];
      expect(init.headers.Authorization).toBe('Bearer at-xyz');
    });

    it('lấy open_id làm username khi người dùng từ chối scope profile', async () => {
      const { username: _drop, ...withoutUsername } = fullUser;
      mockFetch(true, { data: { user: withoutUsername } });

      const profile = await service.getProfile('at');

      // Cột username là NOT NULL nên phải có phương án cuối
      expect(profile.username).toBe('open-1');
    });

    it('số đếm về 0 khi TikTok không trả', async () => {
      mockFetch(true, { data: { user: { open_id: 'open-1' } } });
      const profile = await service.getProfile('at');
      expect(profile.followerCount).toBe(0);
      expect(profile.contentCount).toBe(0);
    });

    it('ném lỗi khi thiếu open_id — không có định danh thì không lưu được', async () => {
      mockFetch(true, { data: { user: { display_name: 'X' } } });
      await expect(service.getProfile('at')).rejects.toThrow(
        'TIKTOK_PROFILE_INVALID',
      );
    });

    it('ném lỗi khi HTTP hỏng', async () => {
      mockFetch(false, {});
      await expect(service.getProfile('at')).rejects.toThrow(
        'TIKTOK_PROFILE_FETCH_FAILED',
      );
    });
  });
});
