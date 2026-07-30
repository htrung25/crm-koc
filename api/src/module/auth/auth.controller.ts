import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../../security/local-auth.guard';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { AuthenticatedAuth } from './entities/authenticated.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, RegisterResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RegisterDto })
  @ApiOperation({ summary: 'Register a new account' })
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiBadRequestResponse({ description: 'Missing name, email or password' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.createAuth(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in and receive a JWT access token' })
  // LocalAuthGuard đọc body trực tiếp qua passport nên không có @Body();
  // khai báo @ApiBody để Swagger vẫn mô tả đúng request shape.
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Wrong email or password' })
  @ApiForbiddenResponse({ description: 'Account is suspended or banned' })
  login(@Request() request: { user: AuthenticatedAuth }) {
    return this.authService.loginAuth(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Account attached to the current token' })
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Account is suspended or banned' })
  me(@Request() request: { user: AuthenticatedAuth }) {
    // JwtStrategy.validate() đã nạp sẵn account vào request.user
    return request.user;
  }
}
