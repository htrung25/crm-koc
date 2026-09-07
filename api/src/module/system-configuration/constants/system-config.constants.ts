/** Cache theo từng key: đường đọc của getString/getNumber/getBoolean/getJson. */
export const SYSTEM_CONFIG_KEY_PREFIX = 'system-config:key:';
/**
 * Cache theo nhóm. Cần riêng vì chỉ có cache theo key thì getByGroup vẫn phải
 * hỏi DB xem nhóm gồm những key nào — miss vĩnh viễn ở đúng đường nóng nhất
 * (AdminMaintenanceInterceptor chạy trên mọi request).
 */
export const SYSTEM_CONFIG_GROUP_PREFIX = 'system-config:group:';

/** Nhóm chứa cờ bật/tắt toàn hệ thống. */
export const SYSTEM_CONFIG_GROUP_ENVIRONMENT = 'environment';
