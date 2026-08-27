import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { EAccountStatus } from '../common/enum/account-statuses.enum';
import { AuthService } from '../module/auth/auth.service';
import { AccountCacheService } from '../security/account-cache.service';
import { SessionService } from '../security/session.service';
import type { AccessTokenPayload } from '../security/jwt-auth.service';
import { AuthenticatedAccount } from '../module/auth/entities/authenticated.entity';
import type { AdminSession } from '../security/session.service';
import {
  EDeviceCheck,
  checkDevice,
  readDeviceId,
} from '../common/util/device-binding.util';
import { EAuditLogCategory, ELoginAction } from '../common/enum/audit-log.enum';
import { AuditLogService } from '../module/admin/audit-log.service';
import { extractClientIp } from '../common/util/ip.util';

/** Request đã qua JwtStrategy có thêm payload gốc để controller đọc session_id. */
export interface RequestWithToken extends Request {
  tokenPayload?: AccessTokenPayload;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly deviceBindingEnforced: boolean;

  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
    private readonly accountCache: AccountCacheService,
    private readonly sessionService: SessionService,
    private readonly auditLogService: AuditLogService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Cùng secret với JwtAuthService.signPair(), KHÔNG dùng JWT_SECRET cũ
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      // cần req để gắn payload lên request cho /logout đọc lại session_id
      passReqToCallback: true,
    });

    this.deviceBindingEnforced =
      config.get<string>('DEVICE_BINDING_ENFORCED', 'false') === 'true';
  }

  async validate(
    request: RequestWithToken,
    payload: AccessTokenPayload,
  ): Promise<AuthenticatedAccount> {
    // 1. Chặn dùng refresh token thay cho access token
    if (payload.type !== 'access') {
      throw new UnauthorizedException('invalid token');
    }

    // 2. Phiên phải còn sống.
    const session = await this.sessionService.getSession(
      payload.sub,
      payload.session_id,
    );
    if (!session) {
      throw new UnauthorizedException('session is no longer valid');
    }

    request.tokenPayload = payload;

    // 2b. Ràng buộc thiết bị. Đặt sau kiểm phiên vì cần session.deviceId, và
    //     trước khi nạp account để không tốn công tra DB cho request sẽ bị chặn.
    await this.assertDevice(request, payload, session);

    // 3. Cache-aside cho account: cache miss mới xuống DB. Ban account sẽ xoá
    //    key này nên đổi trạng thái có hiệu lực ngay, không chờ TTL.
    let account = await this.accountCache.get(payload.sub);
    if (!account) {
      const found = await this.authService.findById(payload.sub);
      if (!found) {
        throw new UnauthorizedException('account no longer exists');
      }
      // password đã bị select: false nên không có trong kết quả
      const { password: _password, ...result } = found;
      account = result;
      await this.accountCache.set(account);
    }

    if (
      account.status === EAccountStatus.SUSPENDED ||
      account.status === EAccountStatus.BANNED
    ) {
      throw new ForbiddenException(
        account.statusReason ?? `account is ${account.status}`,
      );
    }
    await this.sessionService.refreshSession(session);

    return account;
  }

  /*Ràng token với thiết bị đã đăng nhập.*/
  private async assertDevice(
    request: RequestWithToken,
    payload: AccessTokenPayload,
    session: AdminSession,
  ): Promise<void> {
    const deviceId = readDeviceId(request.headers);
    const result = checkDevice(session.deviceId, deviceId);

    if (result === EDeviceCheck.BACKFILL && deviceId) {
      await this.sessionService.attachDevice(session, deviceId);
      return;
    }
    if (result !== EDeviceCheck.MISMATCH) return;

    await this.auditLogService.writeIfAdmin(payload.role, {
      category: EAuditLogCategory.LOGIN,
      action: ELoginAction.FAIL_DEVICE,
      accountId: payload.sub,
      ipAddress: extractClientIp(request),
      userAgent: request.headers['user-agent'],
      metadata: {
        sessionId: payload.session_id,
        enforced: this.deviceBindingEnforced,
      },
    });

    if (this.deviceBindingEnforced) {
      throw new UnauthorizedException('token is not valid for this device');
    }
  }
}
