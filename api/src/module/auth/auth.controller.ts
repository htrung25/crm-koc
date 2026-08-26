import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  HttpException,
  Patch,
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
  ApiNotFoundResponse,
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
import { EmailQueueService } from '../../queue/email/email-queue.service';
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
import { UpdateMeDto, UpdateMeResponseDto } from './dto/update-me.dto';
import { LoginDto, LoginAdminDto } from './dto/login.dto';
import { LoginResponseDto, RegisterResponseDto } from './dto/auth.dto';
import { RefreshTokenDto, TokenPairResponseDto } from './dto/refresh-token.dto';
import { extractClientIp } from '../../common/util/ip.util';
// import type: isolatedModules + emitDecoratorMetadata cấm type thường trong
// chữ ký đã decorate
import type { Request as ExpressRequest } from 'express';

import {
  EAuditLogCategory,
  ELoginAction,
} from '../../common/enum/audit-log.enum';
import { AuditLogService } from '../admin/audit-log.service';

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly emailQueue: EmailQueueService,
    private readonly jwtAuthService: JwtAuthService,
    private readonly auditLogService: AuditLogService,
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
    return this.startOtpChallenge(account);
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
    return this.startOtpChallenge(account);
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
    const ipAddress = extractClientIp(request);
    const userAgent = request.headers['user-agent'];

    if (result === EOtpResult.LOCKED) {
      await this.auditLogService.writeIfAdmin(account.accountRole, {
        category: EAuditLogCategory.LOGIN,
        action: ELoginAction.FAIL_LOCKED,
        accountId: account.id,
        emailAttempted: dto.email,
        ipAddress,
        userAgent,
      });
      throw new ForbiddenException('too many failed attempts, try again later');
    }
    if (result === EOtpResult.EXPIRED) {
      throw new UnauthorizedException('otp has expired, request a new one');
    }
    if (result === EOtpResult.INVALID) {
      await this.auditLogService.writeIfAdmin(account.accountRole, {
        category: EAuditLogCategory.LOGIN,
        action: ELoginAction.FAIL_OTP,
        accountId: account.id,
        emailAttempted: dto.email,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('invalid otp');
    }

    // Trạng thái có thể đã đổi trong lúc OTP còn hiệu lực
    this.assertUsable(account);

    // OTP đi qua chính hòm thư này, nên nhập đúng là đã chứng minh sở hữu
    // email. Không cần luồng xác minh riêng.
    await this.authService.markEmailVerified(account.id);

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
    @Request() request: ExpressRequest,
  ): Promise<AuthLoginPendingResponseDto> {
    const account = await this.requireAccountByEmail(dto.email);
    const result = await this.otpService.resend(account.id);
    const ipAddress = extractClientIp(request);
    const userAgent = request.headers['user-agent'];

    if (result === EOtpResult.LOCKED) {
      await this.auditLogService.writeIfAdmin(account.accountRole, {
        category: EAuditLogCategory.LOGIN,
        action: ELoginAction.FAIL_LOCKED,
        accountId: account.id,
        emailAttempted: dto.email,
        ipAddress,
        userAgent,
      });
      throw new ForbiddenException('too many failed attempts, try again later');
    }
    if (result === EOtpResult.COOLDOWN) {
      throw new HttpException(
        'please wait before requesting another otp',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.sendOtp(account.id);
    await this.auditLogService.writeIfAdmin(account.accountRole, {
      category: EAuditLogCategory.LOGIN,
      action: ELoginAction.OTP_SENT,
      accountId: account.id,
      emailAttempted: dto.email,
      ipAddress,
      userAgent,
    });

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
    // Chưa chọn vai trò thì không khớp cổng đăng nhập nào: cả /login/admin lẫn
    // /login/brand-creator đều đòi một vai trò cụ thể.
    if (
      account.accountRole === null ||
      !allowed.includes(account.accountRole)
    ) {
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

  /** Phát OTP và trả về lời nhắc. Dùng chung cho đăng ký và đăng nhập. */
  private async startOtpChallenge(
    account: AuthenticatedAccount,
    message = 'OTP has been sent to your email',
  ): Promise<AuthLoginPendingResponseDto> {
    const result = await this.otpService.generateAndStore(account.id);
    if (result === EOtpResult.LOCKED) {
      throw new ForbiddenException('too many failed attempts, try again later');
    }

    await this.sendOtp(account.id);
    await this.auditLogService.writeIfAdmin(account.accountRole, {
      category: EAuditLogCategory.LOGIN,
      action: ELoginAction.OTP_SENT,
      accountId: account.id,
      emailAttempted: account.email,
    });

    // KHÔNG trả token ở đây: mật khẩu đúng mới chỉ qua được nửa đầu.
    return { requireOtp: true, message };
  }

  private async sendOtp(accountId: string): Promise<void> {
    await this.emailQueue.enqueueOtp({ accountId });
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
  async registerAdmin(
    @Body() registerDto: RegisterDto,
    @Request() request: ExpressRequest & { user: AuthenticatedAccount },
  ) {
    const created = await this.authService.createAdminAccount(registerDto);
    await this.auditLogService.write({
      category: EAuditLogCategory.AUDIT,
      action: ELoginAction.CREATE,
      accountId: request.user?.id,
      resourceType: 'admin_user',
      resourceId: created.id,
      ipAddress: extractClientIp(request),
      userAgent: request.headers['user-agent'],
      metadata: { email: created.email, name: created.name },
    });
    return created;
  }

  @Post('/register/brand')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RegisterDto })
  @ApiOperation({
    summary: 'Register a new brand account. Returns an OTP challenge',
  })
  @ApiOkResponse({ type: AuthLoginPendingResponseDto })
  @ApiBadRequestResponse({ description: 'Missing name, email or password' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  async registerBrand(
    @Body() registerDto: RegisterDto,
  ): Promise<AuthLoginPendingResponseDto> {
    const account = await this.authService.createAccountUser(
      registerDto,
      ERole.BRAND,
    );
    return this.startOtpChallenge(account);
  }

  @Post('/register/creator')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RegisterDto })
  @ApiOperation({
    summary: 'Register a new creator account. Returns an OTP challenge',
  })
  @ApiOkResponse({ type: AuthLoginPendingResponseDto })
  @ApiBadRequestResponse({ description: 'Missing name, email or password' })
  @ApiConflictResponse({ description: 'Email or phone already exists' })
  async registerCreator(
    @Body() registerDto: RegisterDto,
  ): Promise<AuthLoginPendingResponseDto> {
    const account = await this.authService.createAccountUser(
      registerDto,
      ERole.CREATOR,
    );
    return this.startOtpChallenge(account);
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

    const ipAddress = extractClientIp(request);
    const userAgent = request.headers['user-agent'] ?? null;

    // Xoá phiên là đủ: mọi access token của phiên này chết ngay ở lần gọi
    // tiếp theo vì JwtStrategy không tìm thấy phiên nữa.
    await this.jwtAuthService.logout(payload.sub, payload.session_id, {
      ipAddress,
      userAgent,
    });

    await this.auditLogService.writeIfAdmin(payload.role, {
      category: EAuditLogCategory.LOGIN,
      action: ELoginAction.LOGOUT,
      accountId: payload.sub,
      ipAddress,
      userAgent,
      metadata: { sessionId: payload.session_id },
    });

    return { revoked: true, sessionId: payload.session_id };
  }

  @UseGuards(JwtAuthGuard)
  @Get('auth/me')
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

  // KHÔNG có RolesGuard: tài khoản vừa đăng nhập Google chưa có vai trò, mà
  // đây chính là chỗ để họ chọn. Gắn RolesGuard là khoá họ ra khỏi lối duy nhất.
  @UseGuards(JwtAuthGuard)
  @Patch('auth/me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update your own name, phone, or active role',
    description:
      'Đổi vai trò sẽ cấp cặp token mới và huỷ phiên cũ; các trường hợp khác ' +
      'trả accessToken/refreshToken = null và phiên hiện tại giữ nguyên.',
  })
  @ApiOkResponse({ type: UpdateMeResponseDto })
  @ApiBadRequestResponse({
    description: 'Malformed body, or phone is not a valid Vietnam number',
  })
  @ApiUnauthorizedResponse({
    description: 'Token is missing, invalid or expired',
  })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiConflictResponse({
    description: 'Phone already belongs to another account',
  })
  async updateMe(
    @Request()
    request: ExpressRequest & RequestWithToken & { user: AuthenticatedAccount },
    @Body() dto: UpdateMeDto,
  ): Promise<UpdateMeResponseDto> {
    const previousRole = request.user.accountRole;
    // accountId lấy từ token, không nhận từ body.
    const account = await this.authService.updateMe(request.user.id, dto);

    // Sửa tên hay điện thoại thì không phải xoay token.
    if (account.accountRole === previousRole) {
      return { account, accessToken: null, refreshToken: null };
    }

    // Đổi quyền thì phải xoay phiên: token cũ mang vai trò cũ trong payload.
    const issued = await this.issueTokens(account, request);
    const previousSessionId = request.tokenPayload?.session_id;
    if (previousSessionId) {
      await this.jwtAuthService.logout(account.id, previousSessionId, {
        ipAddress: extractClientIp(request),
        userAgent: request.headers['user-agent'] ?? null,
      });
    }

    return {
      account,
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
    };
  }
}
