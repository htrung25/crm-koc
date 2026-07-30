import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EAccountStatus } from '../common/enum/account-statuses.enum';
import { AuthService } from '../module/auth/auth.service';
import {
  AuthenticatedAuth,
  JwtPayload,
} from '../module/auth/entities/authenticated.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Chỉ được gọi sau khi chữ ký và hạn token đã hợp lệ.
   *
   * Vẫn phải truy vấn DB: token sống tới 1 tiếng, trong khoảng đó account có
   * thể đã bị xoá hoặc bị ban. Nếu chỉ tin payload thì họ vẫn dùng được API.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedAuth> {
    const auth = await this.authService.findById(payload.sub);
    if (!auth) {
      throw new UnauthorizedException('account no longer exists');
    }

    if (
      auth.status === EAccountStatus.SUSPENDED ||
      auth.status === EAccountStatus.BANNED
    ) {
      throw new ForbiddenException(
        auth.statusReason ?? `account is ${auth.status}`,
      );
    }

    // password đã bị select: false nên không có trong kết quả
    const { password: _password, ...result } = auth;
    return result;
  }
}
