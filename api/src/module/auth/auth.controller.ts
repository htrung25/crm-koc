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
import { EAccountRole } from '../../common/enum/account-roles.enum';
import { LocalAuthGuard } from '../../security/local-auth.guard';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { AuthenticatedAuth } from './entities/authenticated.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, RegisterResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  // Endpoint DUY NHẤT tạo được admin. Không công khai: phải là admin đã đăng
  // nhập. Thứ tự guard có ý nghĩa — JwtAuthGuard nạp request.user trước để
  // RolesGuard có cái mà đọc; đảo lại thì RolesGuard luôn thấy user rỗng.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(EAccountRole.ADMIN)
  @Post('/register/admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiBody({ type: RegisterDto })
  @ApiOperation({ summary: 'Create a new admin account, admin only' })
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiForbiddenResponse({ description: 'Requires admin role' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  registerAdmin(@Body() registerDto: RegisterDto) {
    // role do createAdminAuth() hardcode, body không tác động được
    return this.authService.createAdminAuth(registerDto);
  }

  // Có 2 actor công khai nên role đến từ ROUTE, không từ body và cũng không
  // phải một giá trị mặc định đoán mò. Không có route công khai nào tạo admin.
  @Post('/register/brand')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RegisterDto })
  @ApiOperation({ summary: 'Register a new brand account' })
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiBadRequestResponse({ description: 'Missing name, email or password' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  registerBrand(@Body() registerDto: RegisterDto) {
    return this.authService.createAuth(registerDto, EAccountRole.BRAND);
  }

  @Post('/register/creator')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RegisterDto })
  @ApiOperation({ summary: 'Register a new creator account' })
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiBadRequestResponse({ description: 'Missing name, email or password' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  registerCreator(@Body() registerDto: RegisterDto) {
    return this.authService.createAuth(registerDto, EAccountRole.CREATOR);
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
