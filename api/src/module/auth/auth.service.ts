import { Injectable } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedAdmin } from './entities/authenticated-admin.entities';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
  ) {}

  async login(admin: AuthenticatedAdmin) {
    const payload = { email: admin.email, sub: admin.id };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
