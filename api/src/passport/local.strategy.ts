import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../module/auth/auth.service';
import { AuthenticatedAuth } from '../module/auth/entities/authenticated.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  // validateAuth tự throw Unauthorized/Forbidden nếu không hợp lệ
  validate(email: string, password: string): Promise<AuthenticatedAuth> {
    return this.authService.validateAuth(email, password);
  }
}
