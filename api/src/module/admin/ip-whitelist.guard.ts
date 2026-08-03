import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { extractClientIp } from '../../common/util/ip.util';
import { IpWhitelistService } from './ip-whitelist.service';

type RequestWithUser = Request & { user?: { id?: string } };

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  constructor(private readonly ipWhitelistService: IpWhitelistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const adminId = req.user?.id;

    // Fail closed. Guard này luôn nằm sau JwtAuthGuard (guard cấp controller
    // chạy trước guard cấp route) nên thiếu danh tính là dấu hiệu gắn sai chỗ.
    // Trả true ở đây đồng nghĩa tắt hẳn whitelist mà không ai biết.
    if (!adminId) {
      throw new ForbiddenException('IP_WHITELIST_NO_IDENTITY');
    }

    const sourceIp = extractClientIp(req);

    const allowed = await this.ipWhitelistService.isIpAllowed(
      adminId,
      sourceIp,
    );
    if (!allowed) {
      throw new ForbiddenException('IP_NOT_WHITELISTED');
    }

    return true;
  }
}
