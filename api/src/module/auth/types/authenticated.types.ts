import { ERole } from '../../../common/enum/roles.enum';
import { AuthEntity } from '../entities/auth.entity';

export type AuthenticatedAccount = Omit<AuthEntity, 'password'>;
export type PublicRole = ERole.BRAND | ERole.CREATOR;
