import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { SocialTokenService } from './token.service';

function serviceWith(keyBase64: string): SocialTokenService {
  const config = {
    getOrThrow: jest.fn().mockReturnValue(keyBase64),
  } as unknown as ConfigService;
  return new SocialTokenService(config);
}

const KEY_A = randomBytes(32).toString('base64');
const KEY_B = randomBytes(32).toString('base64');

describe('SocialTokenService', () => {
  const aad = SocialTokenService.aadFor('tiktok', 'open-id-1');

  describe('constructor', () => {
    it('chấp nhận khoá đúng 32 byte', () => {
      expect(() => serviceWith(KEY_A)).not.toThrow();
    });

    it('từ chối khoá sai độ dài — bắt lỗi cấu hình lúc khởi động', () => {
      expect(() => serviceWith(randomBytes(16).toString('base64'))).toThrow(
        'must decode to 32 bytes',
      );
    });
  });

  describe('encrypt', () => {
    it('gắn tiền tố phiên bản và đủ 4 phần', () => {
      const parts = serviceWith(KEY_A).encrypt('secret', aad).split('.');
      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe('v1');
    });

    it('cùng một giá trị cho ra ciphertext khác nhau — IV ngẫu nhiên', () => {
      const service = serviceWith(KEY_A);
      expect(service.encrypt('secret', aad)).not.toBe(
        service.encrypt('secret', aad),
      );
    });
  });

  describe('decrypt', () => {
    it('giải mã lại đúng giá trị gốc', () => {
      const service = serviceWith(KEY_A);
      expect(service.decrypt(service.encrypt('token-abc', aad), aad)).toBe(
        'token-abc',
      );
    });

    it('giữ nguyên chuỗi unicode', () => {
      const service = serviceWith(KEY_A);
      const value = 'tiếng Việt 🎉 token';
      expect(service.decrypt(service.encrypt(value, aad), aad)).toBe(value);
    });

    it('TỪ CHỐI khi aad khác — ciphertext không dùng lại được ở dòng khác', () => {
      const service = serviceWith(KEY_A);
      const cipher = service.encrypt('secret', aad);
      const otherAad = SocialTokenService.aadFor('tiktok', 'open-id-2');

      expect(() => service.decrypt(cipher, otherAad)).toThrow(
        'SOCIAL_TOKEN_DECRYPT_FAILED',
      );
    });

    it('từ chối khi sai khoá', () => {
      const cipher = serviceWith(KEY_A).encrypt('secret', aad);
      expect(() => serviceWith(KEY_B).decrypt(cipher, aad)).toThrow(
        'SOCIAL_TOKEN_DECRYPT_FAILED',
      );
    });

    it('từ chối khi ciphertext bị sửa — authTag phát hiện', () => {
      const service = serviceWith(KEY_A);
      const [v, iv, tag, ct] = service.encrypt('secret', aad).split('.');
      const tampered = Buffer.from(ct, 'base64');
      tampered[0] ^= 0xff;

      expect(() =>
        service.decrypt(
          [v, iv, tag, tampered.toString('base64')].join('.'),
          aad,
        ),
      ).toThrow('SOCIAL_TOKEN_DECRYPT_FAILED');
    });

    it('từ chối phiên bản định dạng lạ — chỗ móc cho việc xoay khoá', () => {
      const service = serviceWith(KEY_A);
      const cipher = service.encrypt('secret', aad).replace(/^v1\./, 'v2.');

      expect(() => service.decrypt(cipher, aad)).toThrow(
        'SOCIAL_TOKEN_FORMAT_UNSUPPORTED',
      );
    });

    it('từ chối payload thiếu phần', () => {
      expect(() =>
        serviceWith(KEY_A).decrypt('v1.chi-co-mot-phan', aad),
      ).toThrow('SOCIAL_TOKEN_MALFORMED');
    });
  });

  describe('aadFor', () => {
    it('khác nền tảng thì khác aad dù cùng external id', () => {
      expect(SocialTokenService.aadFor('tiktok', 'x')).not.toBe(
        SocialTokenService.aadFor('youtube', 'x'),
      );
    });
  });
});
