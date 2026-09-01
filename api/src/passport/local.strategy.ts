import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../module/auth/auth.service';
import { AuthenticatedAccount } from '../module/auth/types/authenticated.types';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  // validateAccount tự throw Unauthorized/Forbidden nếu không hợp lệ
  validate(email: string, password: string): Promise<AuthenticatedAccount> {
    return this.authService.validateAccount(email, password);
  }
}
