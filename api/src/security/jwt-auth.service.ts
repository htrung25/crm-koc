import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// node:crypto chỉ sinh được UUID v4, không có v7 — phải dùng package uuid.
import { v7 as uuidv7 } from 'uuid';
import type { StringValue } from 'ms';
import { EBusinessCode } from '../common/enum/business-code.enum';
import { ERole } from '../common/enum/roles.enum';
import { ESessionEventType } from '../common/enum/session-event-types.enum';
import { SessionService } from './session.service';
import type { AdminSession } from './session.service';
import { SessionEventService } from './session-event.service';
import { EDeviceCheck, checkDevice } from '../common/util/device-binding.util';

/** Chỉ chứa thứ thật sự cần: client đọc được payload nên không nhét gì nhạy cảm. */
interface BaseJwtPayload {
  sub: string;
  session_id: string;
  exp: number;
  iat: number;
}

export interface AccessTokenPayload extends BaseJwtPayload {
  type: 'access';
  /** null = đăng nhập bằng Google nhưng chưa chọn vai trò. */
  role: ERole | null;
}

export interface RefreshTokenPayload extends BaseJwtPayload {
  type: 'refresh';
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult extends TokenPair {
  deviceMismatch: boolean;
  accountId: string;
  role: ERole | null;
}

export interface LoginContext {
  email: string;
  displayName: string;
  role: ERole | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
}

export interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
}

@Injectable()
export class JwtAuthService {
  private readonly logger = new Logger(JwtAuthService.name);

  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtl: StringValue;
  private readonly refreshTtl: StringValue;
  private readonly deviceBindingEnforced: boolean;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly sessionEventService: SessionEventService,
  ) {
    // getOrThrow: thiếu secret thì app phải chết lúc khởi động, không được
    // âm thầm ký bằng một giá trị mặc định nào đó.
    this.accessSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    // Dùng chung một secret thì refresh token cũng qua được cửa access token,
    // mất sạch ý nghĩa của việc tách hai loại.
    if (this.accessSecret === this.refreshSecret) {
      throw new Error('JWT_ACCESS_SECRET và JWT_REFRESH_SECRET phải khác nhau');
    }

    this.accessTtl = this.configService.get<string>(
      'JWT_ACCESS_TTL',
      '15m',
    ) as StringValue;
    this.refreshTtl = this.configService.get<string>(
      'JWT_REFRESH_TTL',
      '7d',
    ) as StringValue;

    this.deviceBindingEnforced =
      this.configService.get<string>('DEVICE_BINDING_ENFORCED', 'false') ===
      'true';
  }

  /**
   * Đăng nhập: tạo phiên trong Redis rồi phát cặp token.
   * sessionId và jti đều sinh mới. Phiên giữ currentJti để biết refresh token
   * nào còn hợp lệ.
   */
  async login(
    accountId: string,
    context: LoginContext,
  ): Promise<TokenPair & { sessionId: string }> {
    const sessionId = uuidv7();
    const jti = uuidv7();

    await this.sessionService.createSession({
      sessionId,
      adminId: accountId,
      email: context.email,
      displayName: context.displayName,
      role: context.role,
      csrfToken: uuidv7(),
      currentJti: jti,
      deviceId: context.deviceId ?? undefined,
      loginIp: context.ipAddress ?? undefined,
      loginUserAgent: context.userAgent ?? undefined,
    });

    await this.sessionEventService.record({
      eventType: ESessionEventType.LOGIN,
      accountId,
      sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      sessionId,
      ...this.signPair(accountId, sessionId, jti, context.role),
    };
  }

  /**
   * Kiểm tra access token. KHÔNG tra Redis hay DB — access token là stateless,
   * đó cũng là lý do nó chỉ sống 15 phút.
   */
  validateAccessToken(token: string): AccessTokenPayload {
    const payload = this.verify<AccessTokenPayload>(token, this.accessSecret);

    // Chặn việc dùng refresh token thay cho access token
    if (payload.type !== 'access') {
      throw new UnauthorizedException('invalid token');
    }

    return payload;
  }

  /**
   * Đổi refresh token lấy cặp mới, có xoay vòng jti.
   */
  async refresh(
    refreshToken: string,
    context: RequestContext = {},
  ): Promise<RefreshResult> {
    const payload = this.verify<RefreshTokenPayload>(
      refreshToken,
      this.refreshSecret,
    );

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('invalid token');
    }

    const session = await this.sessionService.getSession(
      payload.sub,
      payload.session_id,
    );
    if (!session) {
      // Phiên đã logout, hết hạn, hoặc bị thu hồi
      throw new UnauthorizedException('session is no longer valid');
    }

    const newJti = uuidv7();
    const rotated = await this.sessionService.rotateJti(
      payload.sub,
      payload.session_id,
      payload.jti,
      newJti,
    );

    if (rotated === 'missing') {
      throw new UnauthorizedException('session is no longer valid');
    }

    if (rotated === 'mismatch') {
      await this.sessionService.deleteSession(payload.sub, payload.session_id);
      await this.sessionEventService.record({
        eventType: ESessionEventType.REVOKED_REUSE,
        accountId: session.adminId,
        sessionId: payload.session_id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { reusedJti: payload.jti },
      });
      this.logger.warn(
        `Refresh token bị dùng lại, đã huỷ phiên ${payload.session_id}`,
      );
      throw new UnauthorizedException('session is no longer valid');
    }

    const device = checkDevice(session.deviceId, context.deviceId ?? null);
    if (device === EDeviceCheck.BACKFILL && context.deviceId) {
      await this.sessionService.attachDevice(session, context.deviceId);
    }
    // Chặn cả MISSING, không chỉ MISMATCH: bỏ header là cách lách rẻ nhất.
    if (
      this.deviceBindingEnforced &&
      (device === EDeviceCheck.MISMATCH || device === EDeviceCheck.MISSING)
    ) {
      this.logger.warn(
        `Refresh bị từ chối vì thiết bị (${device}) account=${session.adminId} session=${payload.session_id}`,
      );
      throw new UnauthorizedException({
        businessCode: EBusinessCode.DEVICE_MISMATCH,
        message:
          device === EDeviceCheck.MISSING
            ? 'device id header is required'
            : 'token is not valid for this device',
      });
    }

    await this.logRefreshIfSuspicious(session, context);

    return {
      ...this.signPair(
        session.adminId,
        payload.session_id,
        newJti,
        session.role,
      ),
      deviceMismatch: device === EDeviceCheck.MISMATCH,
      accountId: session.adminId,
      role: session.role,
    };
  }

  async logout(
    accountId: string,
    sessionId: string,
    context: RequestContext = {},
  ): Promise<void> {
    const session = await this.sessionService.getSession(accountId, sessionId);
    await this.sessionService.deleteSession(accountId, sessionId);

    await this.sessionEventService.record({
      eventType: ESessionEventType.LOGOUT,
      accountId: session?.adminId ?? accountId,
      sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  /** Đăng xuất mọi thiết bị. Trả về số phiên đã thu hồi. */
  async logoutAll(
    accountId: string,
    context: RequestContext = {},
  ): Promise<number> {
    const revoked = await this.sessionService.deleteAllByAccount(accountId);

    await this.sessionEventService.record({
      eventType: ESessionEventType.LOGOUT_ALL,
      accountId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { revokedSessions: revoked },
    });

    return revoked;
  }

  private signPair(
    accountId: string,
    sessionId: string,
    jti: string,
    role: ERole | null,
  ): TokenPair {
    const accessToken = this.jwtService.sign(
      { sub: accountId, session_id: sessionId, type: 'access', role },
      { secret: this.accessSecret, expiresIn: this.accessTtl },
    );

    // Refresh token chỉ mang đúng thứ cần để xoay vòng: không role, không
    // scopes — nó không dùng để phân quyền.
    const refreshToken = this.jwtService.sign(
      { sub: accountId, session_id: sessionId, jti, type: 'refresh' },
      { secret: this.refreshSecret, expiresIn: this.refreshTtl },
    );

    return { accessToken, refreshToken };
  }

  /**
   * Mọi lỗi verify quy về một 401 chung.
   *
   */
  private verify<T extends object>(token: string, secret: string): T {
    try {
      return this.jwtService.verify<T>(token, { secret });
    } catch {
      throw new UnauthorizedException('invalid token');
    }
  }

  //Chỉ ghi log refresh token khi phát hiện IP hoặc User-Agent thay đổi (dấu hiệu bất thường),
  //bỏ qua refresh định kỳ để tránh tràn log.
  private async logRefreshIfSuspicious(
    session: AdminSession,
    context: RequestContext,
  ): Promise<void> {
    if (!session.loginIp && !session.loginUserAgent) return;

    const ipChanged =
      !!context.ipAddress && context.ipAddress !== session.loginIp;
    const uaChanged =
      !!context.userAgent && context.userAgent !== session.loginUserAgent;

    if (!ipChanged && !uaChanged) return;

    const reason =
      ipChanged && uaChanged
        ? 'ip_and_ua_changed'
        : ipChanged
          ? 'ip_changed'
          : 'ua_changed';

    await this.sessionEventService.record({
      eventType: ESessionEventType.REFRESH,
      accountId: session.adminId,
      sessionId: session.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        reason,
        loginIp: session.loginIp,
        loginUserAgent: session.loginUserAgent,
      },
    });
  }
}
