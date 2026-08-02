import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { extractClientIp } from '../../common/util/ip.util';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  constructor(private readonly ipWhitelistService: IpWhitelistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const adminId: string | undefined = req.admin?.adminId;

    if (!adminId) return true;

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
