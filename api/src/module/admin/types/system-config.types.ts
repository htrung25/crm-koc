import { ESystemConfig } from '../constants/system-config.enum';

/** Một dòng sắp ghi. Service đã validate xong trước khi gọi tới repository. */
export interface SystemConfigurationUpsert {
  key: string;
  value: string;
}

export interface CachedConfig {
  value: string;
  type: ESystemConfig;
}
