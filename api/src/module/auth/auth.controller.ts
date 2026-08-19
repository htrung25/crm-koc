import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  HttpException,
  Logger,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
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
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthThrottle,
  AUTH_THROTTLE_BLOCK_MS,
} from '../../security/auth-throttle.decorator';
import { AuthService } from './auth.service';
import { ERole } from '../../common/enum/roles.enum';
import { EAccountStatus } from '../../common/enum/account-statuses.enum';
import { EOtpResult } from '../../common/enum/otp-result.enum';
import { OtpService } from '../../security/otp.service';
import { JwtAuthService } from '../../security/jwt-auth.service';
import { EmailService } from '../../common/services/email.service';
import {
  AuthLoginPendingResponseDto,
  AuthResendOtpDto,
  AuthVerifyOtpDto,
} from './dto/verify-otp.dto';
import { LocalAuthGuard } from '../../security/local-auth.guard';
import { IpWhitelistGuard } from '../admin/ip-whitelist.guard';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import type { RequestWithToken } from '../../passport/jwt.strategy';
import { AuthenticatedAccount } from './entities/authenticated.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, LoginAdminDto } from './dto/login.dto';
import { LoginResponseDto, RegisterResponseDto } from './dto/auth.dto';
import { RefreshTokenDto, TokenPairResponseDto } from './dto/refresh-token.dto';
import { extractClientIp } from '../../common/util/ip.util';
// import type: isolatedModules + emitDecoratorMetadata cấm type thường trong
// chữ ký đã decorate
import type { Request as ExpressRequest } from 'express';

@ApiTags('Auth')
@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  @AuthThrottle()
  @UseGuards(LocalAuthGuard, IpWhitelistGuard)
  @Post('/login/admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin log in. Returns an OTP challenge, never a token',
  })
  // LocalAuthGuard đọc body trực tiếp qua passport nên không có @Body();
  // khai báo @ApiBody để Swagger vẫn mô tả đúng request shape.
  @ApiBody({ type: LoginAdminDto })
  @ApiOkResponse({ type: AuthLoginPendingResponseDto })
  @ApiUnauthorizedResponse({ description: 'Wrong email or password' })
  @ApiForbiddenResponse({
    description:
      'Account is suspended or banned, OTP is locked, or the IP is not whitelisted',
  })
  async loginAdmin(
    @Request() request: ExpressRequest & { user: AuthenticatedAccount },
  ): Promise<AuthLoginPendingResponseDto> {
    const account = this.assertRole(request.user, [ERole.ADMIN]);

    const result = await this.otpService.generateAndStore(account.id);
    if (result === EOtpResult.LOCKED) {
      throw new ForbiddenException('too many failed attempts, try again later');
    }

    await this.sendOtp(account.email, result.otp, account.name);

    // KHÔNG trả token ở đây: mật khẩu đúng mới chỉ qua được nửa đầu.
    return {
      requireOtp: true,
      message: 'OTP has been sent to your email',
    };
  }

  /**
   * Cổng chung cho brand và creator.
   */
  @AuthThrottle()
  @UseGuards(LocalAuthGuard)
  @Post('/login/brand-creator')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Brand/creator log in. Returns an OTP challenge, never a token',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthLoginPendingResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Wrong email or password',
  })
  @ApiForbiddenResponse({ description: 'Account is suspended or banned' })
  async loginBrandOrCreator(
    @Request() request: ExpressRequest & { user: AuthenticatedAccount },
  ): Promise<AuthLoginPendingResponseDto> {
    const account = this.assertRole(request.user, [ERole.BRAND, ERole.CREATOR]);

    const result = await this.otpService.generateAndStore(account.id);
    if (result === EOtpResult.LOCKED) {
      throw new ForbiddenException('too many failed attempts, try again later');
    }

    await this.sendOtp(account.email, result.otp, account.name);

    // KHÔNG trả token ở đây: mật khẩu đúng mới chỉ qua được nửa đầu.
    return {
      requireOtp: true,
      message: 'OTP has been sent to your email',
    };
  }

  // OTP chỉ có 6 chữ số nên đây là mục tiêu dò mã rõ ràng nhất: vượt hạn thì
  // phạt 15 phút thay vì chỉ chờ hết cửa sổ 60 giây.
  @AuthThrottle({ blockMs: AUTH_THROTTLE_BLOCK_MS })
  @Post('/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the login OTP and receive a JWT token' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'OTP is wrong or has expired' })
  @ApiForbiddenResponse({
    description: 'OTP is locked, or the account is suspended or banned',
  })
  async verifyOtp(
    @Body() dto: AuthVerifyOtpDto,
    @Request() request: ExpressRequest,
  ): Promise<LoginResponseDto> {
    const account = await this.requireAccountByEmail(dto.email);
    const result = await this.otpService.verify(account.id, dto.otp);

    if (result === EOtpResult.LOCKED) {
      throw new ForbiddenException('too many failed attempts, try again later');
    }
    if (result === EOtpResult.EXPIRED) {
      throw new UnauthorizedException('otp has expired, request a new one');
    }
    if (result === EOtpResult.INVALID) {
      throw new UnauthorizedException('invalid otp');
    }

    // Trạng thái có thể đã đổi trong lúc OTP còn hiệu lực
    this.assertUsable(account);

    return this.issueTokens(account, request);
  }

  // Mỗi lần gọi là một email được gửi đi.
  @AuthThrottle()
  @Post('/resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a new login OTP, subject to a cooldown' })
  @ApiOkResponse({ type: AuthLoginPendingResponseDto })
  @ApiUnauthorizedResponse({ description: 'Email does not match any account' })
  @ApiForbiddenResponse({ description: 'OTP is locked' })
  @ApiTooManyRequestsResponse({ description: 'Cooldown has not elapsed yet' })
  async resendOtp(
    @Body() dto: AuthResendOtpDto,
  ): Promise<AuthLoginPendingResponseDto> {
    const account = await this.requireAccountByEmail(dto.email);
    const result = await this.otpService.resend(account.id);

    if (result === EOtpResult.LOCKED) {
      throw new ForbiddenException('too many failed attempts, try again later');
    }
    if (result === EOtpResult.COOLDOWN) {
      throw new HttpException(
        'please wait before requesting another otp',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.sendOtp(account.email, result.otp, account.name);

    return { requireOtp: true, message: 'A new OTP has been sent' };
  }

  /** Dùng chung cho cả 3 vai trò: OTP gắn với account, không gắn với role. */
  private async requireAccountByEmail(email: string) {
    const account = await this.authService.findByEmail(email);
    // Email lạ trả đúng thông điệp như OTP sai để không lộ email nào tồn tại.
    if (!account) {
      throw new UnauthorizedException('invalid otp');
    }
    this.assertUsable(account);

    const { password: _password, ...result } = account;
    return result;
  }

  private async issueTokens(
    account: AuthenticatedAccount,
    request: ExpressRequest,
  ): Promise<LoginResponseDto> {
    const { accessToken, refreshToken } = await this.jwtAuthService.login(
      account.id,
      {
        email: account.email,
        displayName: account.name,
        role: account.accountRole,
        ipAddress: extractClientIp(request),
        userAgent: request.headers['user-agent'] ?? null,
      },
    );

    return {
      accessToken,
      refreshToken,
      account: {
        id: account.id,
        email: account.email,
        name: account.name,
        accountRole: account.accountRole,
        status: account.status,
      },
    };
  }

  private assertRole(
    account: AuthenticatedAccount,
    allowed: ERole[],
  ): AuthenticatedAccount {
    if (!allowed.includes(account.accountRole)) {
      throw new UnauthorizedException('invalid credentials');
    }
    return account;
  }

  private assertUsable(account: AuthenticatedAccount): void {
    if (
      account.status === EAccountStatus.SUSPENDED ||
      account.status === EAccountStatus.BANNED
    ) {
      throw new ForbiddenException(
        account.statusReason ?? `account is ${account.status}`,
      );
    }
  }

  private async sendOtp(
    email: string,
    otp: string,
    name: string,
  ): Promise<void> {
    try {
      await this.emailService.sendOtpEmail(email, otp, name);
    } catch (error) {
      this.logger.warn(
        `Không gửi được mail OTP tới ${email}: ${(error as Error).message}. OTP = ${otp}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
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
    return this.authService.createAdminAccount(registerDto);
  }

  @Post('/register/brand')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RegisterDto })
  @ApiOperation({ summary: 'Register a new brand account' })
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiBadRequestResponse({ description: 'Missing name, email or password' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  registerBrand(@Body() registerDto: RegisterDto) {
    return this.authService.createAccountUser(registerDto, ERole.BRAND);
  }

  @Post('/register/creator')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RegisterDto })
  @ApiOperation({ summary: 'Register a new creator account' })
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiBadRequestResponse({ description: 'Missing name, email or password' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  registerCreator(@Body() registerDto: RegisterDto) {
    return this.authService.createAccountUser(registerDto, ERole.CREATOR);
  }

  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đổi refresh token lấy cặp token mới (có xoay vòng)',
    description:
      'Token cũ vô hiệu ngay sau khi gọi. Dùng lại token đã xoay bị coi là ' +
      'dấu hiệu bị đánh cắp và toàn bộ phiên sẽ bị huỷ.',
  })
  @ApiOkResponse({ type: TokenPairResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token sai, hết hạn, sai loại, hoặc phiên đã bị thu hồi',
  })
  refresh(
    @Body() dto: RefreshTokenDto,
    @Request() request: ExpressRequest,
  ): Promise<TokenPairResponseDto> {
    // IP/User-Agent để đối chiếu với lúc đăng nhập: lệch thì ghi session_event
    return this.jwtAuthService.refresh(dto.refreshToken, {
      ipAddress: extractClientIp(request),
      userAgent: request.headers['user-agent'] ?? null,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke the current access token' })
  @ApiOkResponse({ description: 'Token revoked until it expires' })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  async logout(@Request() request: RequestWithToken) {
    // payload gốc do JwtStrategy gắn lên request; request.user chỉ có account
    const payload = request.tokenPayload;
    if (!payload) {
      throw new UnauthorizedException('token payload missing');
    }

    // Xoá phiên là đủ: mọi access token của phiên này chết ngay ở lần gọi
    // tiếp theo vì JwtStrategy không tìm thấy phiên nữa.
    await this.jwtAuthService.logout(payload.sub, payload.session_id, {
      ipAddress: extractClientIp(request),
      userAgent: request.headers['user-agent'] ?? null,
    });

    return { revoked: true, sessionId: payload.session_id };
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
  me(@Request() request: { user: AuthenticatedAccount }) {
    // JwtStrategy.validate() đã nạp sẵn account vào request.user
    return request.user;
  }
}
