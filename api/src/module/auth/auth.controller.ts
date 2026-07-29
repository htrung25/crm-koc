import {
  Controller,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminService } from '../admin/admin.service';
import { LocalAuthGuard } from 'src/security/local-auth.guard';
import { AuthenticatedAdmin } from './entities/authenticated-admin.entities';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminService: AdminService,
  ) {}

  @Post('/register')
  @HttpCode(HttpStatus.OK)
  register(@Body() adminData: any) {
    return this.adminService.createAdmin(adminData);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Request() request: { user: AuthenticatedAdmin }) {
    return this.authService.login(request.user);
  }
}
