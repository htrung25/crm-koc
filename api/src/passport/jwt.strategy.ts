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
import { TokenBlacklistService } from '../security/token-blacklist.service';
import {
  AuthenticatedAccount,
  VerifiedJwtPayload,
} from '../module/auth/entities/authenticated.entity';

/** Request đã qua JwtStrategy có thêm payload gốc để controller dùng khi logout. */
export interface RequestWithToken extends Request {
  tokenPayload?: VerifiedJwtPayload;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
    private readonly blacklist: TokenBlacklistService,
    private readonly accountCache: AccountCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      // cần req để gắn payload lên request cho /logout đọc lại jti + exp
      passReqToCallback: true,
    });
  }

  async validate(
    request: RequestWithToken,
    payload: VerifiedJwtPayload,
  ): Promise<AuthenticatedAccount> {
    // 1. Blacklist trước tiên — token đã logout thì không cần đụng tới DB
    if (payload.jti && (await this.blacklist.isRevoked(payload.jti))) {
      throw new UnauthorizedException('token has been revoked');
    }

    request.tokenPayload = payload;

    // 2. Cache-aside: cache miss mới xuống DB. Ban account sẽ xoá key này
    //    nên thay đổi trạng thái có hiệu lực ngay, không chờ TTL.
    let account = await this.accountCache.get(payload.sub);
    if (!account) {
      const auth = await this.authService.findById(payload.sub);
      if (!auth) {
        throw new UnauthorizedException('account no longer exists');
      }
      // password đã bị select: false nên không có trong kết quả
      const { password: _password, ...result } = auth;
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

    return account;
  }
}
