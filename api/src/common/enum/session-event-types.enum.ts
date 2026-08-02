export enum ESessionEventType {
  /** Đăng nhập thành công, phiên mới được tạo trong Redis. */
  LOGIN = 'login',

  LOGIN_FAILED = 'login_failed',

  REFRESH = 'refresh',

  LOGOUT = 'logout',

  LOGOUT_ALL = 'logout_all',

  REVOKED_REUSE = 'revoked_reuse',

  REVOKED_BY_ADMIN = 'revoked_by_admin',
}
