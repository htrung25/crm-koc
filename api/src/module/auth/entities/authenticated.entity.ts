import { EAccountRole } from '../../../common/enum/account-roles.enum';
import { AuthEntity } from './auth.entity';

/**
 * Account đã xác thực, luôn không chứa password.
 * Đây là kiểu của `request.user` sau khi qua guard.
 */
export type AuthenticatedAuth = Omit<AuthEntity, 'password'>;

/** Payload được ký vào JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: EAccountRole;
}
