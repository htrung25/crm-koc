import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  /** Tên các biến môi trường còn trống; rỗng nghĩa là cấu hình đủ. */
  private readonly missingConfig: string[];

  constructor(configService: ConfigService) {
    this.bucket = configService.get<string>('STORAGE_BUCKET', '').trim();
    const accessKeyId = configService
      .get<string>('STORAGE_ACCESS_KEY_ID', '')
      .trim();
    const secretAccessKey = configService
      .get<string>('STORAGE_SECRET_ACCESS_KEY', '')
      .trim();

    this.missingConfig = [
      ['STORAGE_BUCKET', this.bucket],
      ['STORAGE_ACCESS_KEY_ID', accessKeyId],
      ['STORAGE_SECRET_ACCESS_KEY', secretAccessKey],
    ]
      .filter(([, value]) => value === '')
      .map(([name]) => name);

    if (this.missingConfig.length > 0) {
      // KHÔNG ném ở đây: storage là một tính năng, không phải hạ tầng lõi.
      // Bắt cả API chết vì thiếu credential R2 là quá tay. Ném lúc dùng thật.
      this.logger.warn(
        `Thiếu cấu hình storage: ${this.missingConfig.join(', ')}. ` +
          'Mọi thao tác tài liệu sẽ báo lỗi cho tới khi khai đủ.',
      );
    }

    // Bỏ trống endpoint = dùng AWS S3 mặc định; R2 thì bắt buộc khai.
    const endpoint = configService.get<string>('STORAGE_ENDPOINT', '').trim();

    this.client = new S3Client({
      // R2 không có region thật, quy ước dùng 'auto'.
      region: configService.get<string>('STORAGE_REGION', 'auto'),
      ...(endpoint ? { endpoint } : {}),
      credentials: { accessKeyId, secretAccessKey },
      // SDK đời mới bật kiểm checksum CRC32 mặc định, từng làm hỏng nhiều dịch
      // vụ tương thích-S3 kể cả R2. WHEN_REQUIRED giữ hành vi cũ.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  /** Gọi ở đầu mọi thao tác chạm storage thật. */
  private assertConfigured(): void {
    if (this.missingConfig.length > 0) {
      throw new ServiceUnavailableException(
        `storage is not configured: missing ${this.missingConfig.join(', ')}`,
      );
    }
  }

  async generateKey(prefix: string): Promise<string> {
    return `${prefix}${randomBytes(16).toString('hex')}`;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    this.assertConfigured();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  /** Object bị lifecycle xoá thì quy về 404, không để lỗi SDK lọt ra ngoài. */
  async get(key: string): Promise<Buffer> {
    this.assertConfigured();
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (!result.Body) {
        throw new NotFoundException('document content is gone');
      }
      return Buffer.from(await result.Body.transformToByteArray());
    } catch (error) {
      if (this.isNotFound(error)) {
        throw new NotFoundException('document content is gone');
      }
      throw error;
    }
  }

  /**
   * Copy phía server, không tải về rồi đẩy lên. Dùng cho hai việc: nộp lại KYC
   * (mỗi dòng tài liệu sở hữu một object riêng) và chuyển sang tiền tố
   * `verified/` khi admin duyệt.
   */
  async copy(fromKey: string, toKey: string): Promise<void> {
    this.assertConfigured();
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${fromKey}`,
        Key: toKey,
      }),
    );
  }

  /** Xoá thứ không tồn tại không phải lỗi — S3 vốn idempotent ở đây. */
  async remove(key: string): Promise<void> {
    this.assertConfigured();
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error) {
      if (this.isNotFound(error)) {
        this.logger.warn(`Xoá object không tồn tại: ${key}`);
        return;
      }
      throw error;
    }
  }

  private isNotFound(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }
    // R2 và S3 trả tên khác nhau cho cùng một tình huống.
    const name = (error as { name?: string }).name;
    return name === 'NoSuchKey' || name === 'NotFound';
  }
}
