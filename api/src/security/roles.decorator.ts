import { SetMetadata } from '@nestjs/common';
import { EAccountRole } from '../common/enum/account-roles.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: EAccountRole[]) =>
  SetMetadata(ROLES_KEY, roles);
