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

/** Request đã qua JwtStrategy có thêm payload gốc để controller đọc session_id. */
export interface RequestWithToken extends Request {
  tokenPayload?: AccessTokenPayload;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
    private readonly accountCache: AccountCacheService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Cùng secret với JwtAuthService.signPair(), KHÔNG dùng JWT_SECRET cũ
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      // cần req để gắn payload lên request cho /logout đọc lại session_id
      passReqToCallback: true,
    });
  }

  async validate(
    request: RequestWithToken,
    payload: AccessTokenPayload,
  ): Promise<AuthenticatedAccount> {
    // 1. Chặn dùng refresh token thay cho access token
    if (payload.type !== 'access') {
      throw new UnauthorizedException('invalid token');
    }

    // 2. Phiên phải còn sống. Đây là điểm thay thế cho blacklist theo jti:
    //    logout xoá phiên nên MỌI access token của phiên đó chết cùng lúc,
    //    không cần liệt kê từng token.
    const session = await this.sessionService.getSession(payload.session_id);
    if (!session) {
      throw new UnauthorizedException('session is no longer valid');
    }

    request.tokenPayload = payload;

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
}
