export enum ESessionEventType {
  LOGIN = 'login',
  REFRESH = 'refresh',
  LOGOUT = 'logout',
  LOGOUT_ALL = 'logout_all',
  REVOKED_REUSE = 'revoked_reuse',
  REVOKED_BY_ADMIN = 'revoked_by_admin',
  /** Bị đá vì tài khoản vượt trần số phiên đồng thời. */
  EVICTED = 'evicted',
}
