import {
  Controller,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/security/local-auth.guard';
import { AuthenticatedAuth } from './entities/authenticated.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, RegisterResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng ký account mới' })
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiBadRequestResponse({ description: 'Thiếu email hoặc password' })
  @ApiConflictResponse({ description: 'Email hoặc phone đã tồn tại' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.createAuth(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập, trả về JWT access token' })
  // LocalAuthGuard đọc body trực tiếp qua passport nên không có @Body();
  // khai báo @ApiBody để Swagger vẫn mô tả đúng request shape.
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Sai email hoặc password' })
  @ApiForbiddenResponse({ description: 'Account bị suspended hoặc banned' })
  login(@Request() request: { user: AuthenticatedAuth }) {
    return this.authService.loginAuth(request.user);
  }
}
