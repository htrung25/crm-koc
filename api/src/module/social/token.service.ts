import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Phiên bản của định dạng ciphertext, nằm ngay đầu payload.
 *
 * Không có nó thì ngày cần xoay SOCIAL_TOKEN_ENCRYPTION_KEY (lộ khoá, hoặc
 * chính sách định kỳ) mọi token trong DB thành rác không giải mã được, và
 * không có cách nào phân biệt dòng nào mã bằng khoá cũ. Thêm bây giờ là miễn
 * phí; thêm sau khi đã có dữ liệu thì phải migrate cả bảng.
 */
const FORMAT_VERSION = 'v1';

@Injectable()
export class SocialTokenService {
  private readonly key: Buffer;

  constructor(configService: ConfigService) {
    const keyBase64 = configService.getOrThrow<string>(
      'SOCIAL_TOKEN_ENCRYPTION_KEY',
    );

    this.key = Buffer.from(keyBase64, 'base64');

    if (this.key.length !== 32) {
      throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY must decode to 32 bytes');
    }
  }

  /**
   * `aad` (Additional Authenticated Data) buộc ciphertext vào đúng ngữ cảnh
   * của nó: GCM sẽ từ chối giải mã nếu aad lúc decrypt khác lúc encrypt. Nhờ
   * vậy không thể chép access_token_encrypted của tài khoản này sang dòng khác
   * rồi dùng được — thứ mà nếu chỉ mã hoá suông thì làm được.
   */
  encrypt(value: string, aad: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from(aad, 'utf8'));

    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      FORMAT_VERSION,
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join('.');
  }

  decrypt(payload: string, aad: string): string {
    const [version, ivBase64, authTagBase64, encryptedBase64] =
      payload.split('.');

    if (version !== FORMAT_VERSION) {
      throw new InternalServerErrorException('SOCIAL_TOKEN_FORMAT_UNSUPPORTED');
    }

    if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
      throw new InternalServerErrorException('SOCIAL_TOKEN_MALFORMED');
    }

    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.key,
        Buffer.from(ivBase64, 'base64'),
      );
      decipher.setAAD(Buffer.from(aad, 'utf8'));
      decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedBase64, 'base64')),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch {
      // Sai khoá, ciphertext hỏng, hoặc aad không khớp. Ném lỗi có kiểm soát
      // thay vì để Error thô của node:crypto lên tới client kèm stack.
      throw new InternalServerErrorException('SOCIAL_TOKEN_DECRYPT_FAILED');
    }
  }

  /** Ngữ cảnh buộc vào ciphertext: một tài khoản trên một nền tảng. */
  static aadFor(platform: string, externalAccountId: string): string {
    return `${platform}:${externalAccountId}`;
  }
}
