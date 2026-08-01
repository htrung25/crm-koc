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
import { EmailService } from '../../common/services/email.service';
import {
  LoginPendingResponseDto,
  ResendOtpDto,
  VerifyOtpDto,
} from '../admin/dto/verify-otp.dto';
import { LocalAuthGuard } from '../../security/local-auth.guard';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { RolesGuard } from '../../security/roles.guard';
import { Roles } from '../../security/roles.decorator';
import { TokenBlacklistService } from '../../security/token-blacklist.service';
import type { RequestWithToken } from '../../passport/jwt.strategy';
import { AuthenticatedAccount } from './entities/authenticated.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, RegisterResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly blacklist: TokenBlacklistService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) {}

  // Chặn dò mật khẩu, đồng thời bịt đường gọi lại /login để reset bộ đếm
  // resend OTP (generateAndStore xoá key otp:resend:).
  @AuthThrottle()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Log in. Admin accounts receive an OTP instead of a token; other roles get the token directly',
  })
  // LocalAuthGuard đọc body trực tiếp qua passport nên không có @Body();
  // khai báo @ApiBody để Swagger vẫn mô tả đúng request shape.
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description:
      'LoginResponseDto for brand/creator, LoginPendingResponseDto for admin',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Wrong email or password' })
  @ApiForbiddenResponse({
    description: 'Account is suspended, banned, or OTP is locked',
  })
  async login(
    @Request() request: { user: AuthenticatedAccount },
  ): Promise<LoginResponseDto | LoginPendingResponseDto> {
    const account = request.user;

    // Chỉ admin mới qua bước OTP. brand/creator giữ nguyên luồng cũ.
    if (account.accountRole !== ERole.ADMIN) {
      return this.authService.loginAccount(account);
    }

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
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<LoginResponseDto> {
    const account = await this.requireAdminByEmail(dto.email);
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

    return this.authService.loginAccount(account);
  }

  // Mỗi lần gọi là một email được gửi đi.
  @AuthThrottle()
  @Post('/resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a new login OTP, subject to a cooldown' })
  @ApiOkResponse({ type: LoginPendingResponseDto })
  @ApiUnauthorizedResponse({ description: 'Email is not an admin account' })
  @ApiForbiddenResponse({ description: 'OTP is locked' })
  @ApiTooManyRequestsResponse({ description: 'Cooldown has not elapsed yet' })
  async resendOtp(@Body() dto: ResendOtpDto): Promise<LoginPendingResponseDto> {
    const account = await this.requireAdminByEmail(dto.email);
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

  /**
   * Tra account admin theo email.
   *
   * Email không tồn tại và email không phải admin đều trả CÙNG một lỗi
   * `invalid otp` — nếu phân biệt, endpoint này thành công cụ dò xem email
   * nào là tài khoản admin của hệ thống.
   */
  private async requireAdminByEmail(email: string) {
    const account = await this.authService.findByEmail(email);
    if (!account || account.accountRole !== ERole.ADMIN) {
      throw new UnauthorizedException('invalid otp');
    }
    this.assertUsable(account);

    const { password: _password, ...result } = account;
    return result;
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

  /**
   * Gửi mail nhưng không để lỗi gửi làm hỏng cả request: OTP đã nằm trong
   * Redis rồi, chặn ở đây thì người dùng mất mã mà vẫn bị tính một lần phát.
   * Thiếu SENDGRID_API_KEY vẫn lấy được mã qua log để thao tác trên Swagger.
   */
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

  // Endpoint DUY NHẤT tạo được admin. Không công khai: phải là admin đã đăng
  // nhập. Thứ tự guard có ý nghĩa — JwtAuthGuard nạp request.user trước để
  // RolesGuard có cái mà đọc; đảo lại thì RolesGuard luôn thấy user rỗng.
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

    const revoked = await this.blacklist.revoke(payload.jti, payload.exp);
    return { revoked, expiresAt: new Date(payload.exp * 1000).toISOString() };
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
