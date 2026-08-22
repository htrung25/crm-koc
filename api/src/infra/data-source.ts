import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy';
import { AuthEntity } from '../module/auth/entities/auth.entity';
import { BrandProfile } from '../module/brand/entities/brand-profile.entity';
import { CreatorProfile } from '../module/creator/entities/creator-profile.entity';
import { SessionEvent } from '../module/auth/entities/session-event.entity';
import { AdminUser } from '../module/admin/entities/admin-user.entity';
import { SystemConfiguration } from '../module/admin/entities/system-configuration.entity';
import { SocialAccount } from '../module/creator/entities/social-account.entity';
import { Collaboration } from '../module/collaboration/entities/collaboration.entity';
import { KycSubmission } from '../module/kyc/entities/kyc-submission.entity';
import { KycDocument } from '../module/kyc/entities/kyc-document.entity';
import { KycDocumentView } from '../module/kyc/entities/kyc-document-view.entity';

/**
 * DataSource dành riêng cho TypeORM CLI (migration:run / migration:revert).
 * App lúc runtime vẫn dùng DatabaseModule; file này chỉ tồn tại vì CLI cần một
 * DataSource độc lập với Nest DI. Giữ cấu hình khớp với DatabaseModule.
 */

const entities = [
  AuthEntity,
  BrandProfile,
  CreatorProfile,
  SessionEvent,
  AdminUser,
  SystemConfiguration,
  SocialAccount,
  Collaboration,
  KycSubmission,
  KycDocument,
  KycDocumentView,
];

// Chạy qua ts-node thì đọc migration .ts, chạy từ dist thì đọc .js đã build.
const isTsRunTime = __filename.endsWith('.ts');
const migrations = isTsRunTime ? ['migrations/*.ts'] : ['dist/migrations/*.js'];

function buildOptions(): DataSourceOptions {
  const url = process.env.DATABASE_URL;
  const sslEnabled = process.env.DATABASE_SSL_ENABLED === 'true';

  if (url) {
    return {
      type: 'postgres',
      url,
      entities,
      migrations,
      synchronize: false,
      namingStrategy: new SnakeNamingStrategy(),
    };
  }

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'crm_koc',
    entities,
    migrations,
    synchronize: false,
    namingStrategy: new SnakeNamingStrategy(),
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  };
}

export default new DataSource(buildOptions());
