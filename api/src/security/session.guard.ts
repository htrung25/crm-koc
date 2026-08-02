import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';
import {
  SESSION_COOKIE_DEFAULT_NAME,
  SESSION_COOKIE_NAME_KEY,
} from '../common/constants/session.constants';

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly cookieName: string;

  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
  ) {
    this.cookieName = this.configService.get<string>(
      SESSION_COOKIE_NAME_KEY,
      SESSION_COOKIE_DEFAULT_NAME,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const sessionId = req.cookies?.[this.cookieName];
    if (!sessionId) throw new UnauthorizedException('SESSION_EXPIRED');

    const session = await this.sessionService.getSession(sessionId);
    if (!session) throw new UnauthorizedException('SESSION_EXPIRED');

    // Refresh idle timeout on every valid request
    await this.sessionService.refreshSession(session);

    // Set req.adminSession (full typed session)
    req.adminSession = session;

    // Set req.admin with the same shape as JwtGuard so existing controllers work unchanged
    req.admin = {
      adminId: session.adminId,
      email: session.email,
      displayName: session.displayName,
      role: session.role,
    };

    return true;
  }
}
