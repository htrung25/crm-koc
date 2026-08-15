import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { AdminUser } from './entities/admin-user.entity';
import { EAdminRole } from './enum/admin-roles.enum';

/** JwtAuthGuard gắn req.user trước khi guard này chạy. */
type RequestWithUser = Request & { user?: { id?: string } };

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepo: Repository<AdminUser>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const accountId = req.user?.id;

    // Fail closed: guard này luôn nằm sau JwtAuthGuard nên thiếu danh tính là
    // dấu hiệu gắn sai thứ tự, không phải chuyện bình thường.
    if (!accountId) {
      throw new UnauthorizedException('authentication required');
    }

    const admin = await this.adminUserRepo.findOne({
      where: { accountId },
      select: { accountId: true, adminRole: true },
    });

    if (admin?.adminRole !== EAdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('REQUIRES_SUPER_ADMIN');
    }

    return true;
  }
}
