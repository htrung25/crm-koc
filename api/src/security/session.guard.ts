import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthService } from '../module/auth/auth.service';
import type { AuthenticatedAccount } from '../module/auth/types/authenticated.types';
import { AccountCacheService } from './account-cache.service';
import { SessionService } from './session.service';
import {
  SESSION_COOKIE_DEFAULT_NAME,
  SESSION_COOKIE_NAME_KEY,
} from '../common/constants/session.constants';

type RequestWithUser = Request & { user?: AuthenticatedAccount };

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly cookieName: string;

  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly accountCache: AccountCacheService,
    private readonly authService: AuthService,
  ) {
    this.cookieName = this.configService.get<string>(
      SESSION_COOKIE_NAME_KEY,
      SESSION_COOKIE_DEFAULT_NAME,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();

    // cookies là Record<string, any> nên giá trị lấy ra chưa chắc là chuỗi.
    const raw: unknown = req.cookies?.[this.cookieName];
    if (typeof raw !== 'string' || raw.length === 0) {
      throw new UnauthorizedException('SESSION_EXPIRED');
    }

    const separator = raw.indexOf('.');
    if (separator <= 0) {
      throw new UnauthorizedException('SESSION_EXPIRED');
    }
    const accountId = raw.slice(0, separator);
    const sessionId = raw.slice(separator + 1);

    const session = await this.sessionService.getSession(accountId, sessionId);
    if (!session) throw new UnauthorizedException('SESSION_EXPIRED');

    // Gia hạn idle timeout trên mỗi request hợp lệ
    await this.sessionService.refreshSession(session);

    // Phiên trong Redis không giữ đủ các trường của AuthEntity (thiếu phone,
    // status, statusReason...), nên phải nạp account thật. Cache-aside giống
    // JwtStrategy: miss mới xuống DB.
    let account = await this.accountCache.get(session.adminId);
    if (!account) {
      const found = await this.authService.findById(session.adminId);
      if (!found) {
        throw new UnauthorizedException('account no longer exists');
      }
      // password đã select: false nên không có trong kết quả
      const { password: _password, ...result } = found;
      account = result;
      await this.accountCache.set(account);
    }

    req.user = account;

    return true;
  }
}
