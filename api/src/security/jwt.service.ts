import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { EAccountRole } from 'src/common/enum/account-roles.enum';

export interface JwtPayload {
  sub: string; // adminId
  email: string;
  displayName: string;
  role: EAccountRole;
  type: 'access' | 'refresh';
}

@Injectable()
export class JwtAuthService {
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_TOKEN_EXPIRES_IN',
      '15m',
    );
    this.refreshTokenExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_EXPIRES_IN',
      '8h',
    );
  }
  generateAccessToken(payload: Omit<JwtPayload, 'type'>): string {
    const tokenPayload: Record<string, any> = {
      ...payload,
      type: 'access',
    };
    return this.jwtService.sign(tokenPayload, {
      expiresIn: this.accessTokenExpiresIn as StringValue | number,
    });
  }

  generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
    const tokenPayload: Record<string, any> = {
      ...payload,
      type: 'refresh',
    };
    return this.jwtService.sign(tokenPayload, {
      expiresIn: this.refreshTokenExpiresIn as StringValue | number,
    });
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode<JwtPayload>(token);
    } catch {
      return null;
    }
  }
}
