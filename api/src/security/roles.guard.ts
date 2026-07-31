import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EAccountRole } from '../common/enum/account-roles.enum';
import { AuthenticatedAccount } from '../module/auth/entities/authenticated.entity';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // getAllAndOverride: @Roles ở method đè lên @Roles ở class
    const required = this.reflector.getAllAndOverride<EAccountRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Không khai báo @Roles => route không giới hạn role
    if (!required?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedAccount }>();
    const user = request.user;

    // Guard này chỉ xét role; việc xác thực là của JwtAuthGuard chạy trước nó.
    // Nếu thiếu user nghĩa là route quên gắn JwtAuthGuard => fail closed.
    if (!user) {
      throw new UnauthorizedException('authentication required');
    }

    if (!required.includes(user.accountRole)) {
      throw new ForbiddenException(`requires role: ${required.join(' or ')}`);
    }

    return true;
  }
}
