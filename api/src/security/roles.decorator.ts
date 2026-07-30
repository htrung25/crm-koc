import { SetMetadata } from '@nestjs/common';
import { EAccountRole } from '../common/enum/account-roles.enum';

export const ROLES_KEY = 'roles';

/**
 * Khai báo role được phép truy cập route/controller.
 * Phải dùng kèm RolesGuard, decorator chỉ gắn metadata chứ không tự chặn.
 */
export const Roles = (...roles: EAccountRole[]) =>
  SetMetadata(ROLES_KEY, roles);
