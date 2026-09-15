import { ERole } from '../../../common/enum/roles.enum';

/**
 * Account đã xác thực, luôn không chứa password.
 * Đây là kiểu của `request.user` sau khi qua guard.
 */

/** Payload được ký vào JWT. */
export interface JwtPayload {
  /** Id riêng của từng token, dùng làm khoá blacklist khi logout. */
  jti: string;
  sub: string;
  email: string;
  name: string;
  role: ERole;
}

/** Payload đã được verify: jsonwebtoken tự thêm iat/exp. */
export interface VerifiedJwtPayload extends JwtPayload {
  iat: number;
  exp: number;
}
