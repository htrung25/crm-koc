import { ForbiddenException } from '@nestjs/common';
import { ERole } from '../enum/roles.enum';
import { PAYMENT_ROLES } from '../../module/payment/constants/payment.constants';

// Chặn cả khi service bị gọi thẳng, không qua RolesGuard của controller.
export function assertPaymentRole(
  role: ERole | null | undefined,
): asserts role is ERole.BRAND | ERole.CREATOR {
  if (!role || !PAYMENT_ROLES.includes(role)) {
    throw new ForbiddenException('only creator or brand accounts can do this');
  }
}
