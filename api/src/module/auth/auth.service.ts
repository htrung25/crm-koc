import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ERole } from '../../common/enum/roles.enum';
import { EAccountStatus } from '../../common/enum/account-statuses.enum';
import { BCRYPT_ROUNDS, normalizePhone } from '../../common/util/account.util';
import { BrandProfileService } from '../brand/brand-profile.service';
import { CreatorProfileService } from '../creator/creator-profile.service';
import { AdminProfileService } from '../admin/admin-profile.service';
import { AccountCacheService } from '../../security/account-cache.service';
import { AuthEntity } from './entities/auth.entity';
import { AuthenticatedAccount } from './entities/authenticated.entity';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import {
  EAuditLogCategory,
  ELoginAction,
} from '../../common/enum/audit-log.enum';
import { AuditLogService } from '../admin/audit-log.service';

const PG_UNIQUE_VIOLATION = '23505';

export type PublicRole = ERole.BRAND | ERole.CREATOR;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly adminProfileService: AdminProfileService,
    private readonly brandProfileService: BrandProfileService,
    private readonly creatorProfileService: CreatorProfileService,
    private readonly accountCache: AccountCacheService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /** Chưa chọn vai trò thì chưa có hồ sơ nào để tạo — PATCH /auth/me lo sau. */
  private createProfileFor(account: AuthenticatedAccount): Promise<unknown> {
    if (account.accountRole === null) {
      return Promise.resolve(null);
    }
    switch (account.accountRole) {
      case ERole.ADMIN:
        return this.adminProfileService.create(
          account.id,
          account.name,
          account.email,
        );
      case ERole.BRAND:
        return this.brandProfileService.create(
          account.id,
          account.name,
          account.email,
        );
      case ERole.CREATOR:
        return this.creatorProfileService.create(
          account.id,
          account.name,
          account.email,
        );
    }
  }

  async createAccountUser(
    dto: RegisterDto,
    role: PublicRole,
  ): Promise<AuthenticatedAccount> {
    return this.createAccount(dto, role);
  }

  async createAdminAccount(dto: RegisterDto): Promise<AuthenticatedAccount> {
    return this.createAccount(dto, ERole.ADMIN);
  }

  private async createAccount(
    dto: RegisterDto,
    role: ERole,
  ): Promise<AuthenticatedAccount> {
    // Không kiểm tra rỗng ở đây nữa: @IsNotEmpty/@IsEmail/@MinLength trong
    // RegisterDto đã chặn từ tầng ValidationPipe.

    const phone = this.resolvePhone(dto.phone);

    const account = this.authRepository.create({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone,
      // Lớp 2: role đến từ tham số do controller quyết định, KHÔNG bao giờ
      // đọc từ dto — payload của client không được ảnh hưởng tới phân quyền.
      accountRole: role,
      status: EAccountStatus.ACTIVE,
      password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    });

    try {
      const saved = await this.authRepository.save(account);
      await this.createProfileFor(saved);
      // emailVerifiedAt để null: OTP nhập đúng lần đầu mới ghi mốc xác minh.
      const { password: _password, ...result } = saved;
      return result;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code ===
          PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException('email or phone already exists');
      }
      throw error;
    }
  }

  async markEmailVerified(accountId: string): Promise<void> {
    await this.authRepository.update(
      { id: accountId, emailVerifiedAt: IsNull() },
      { emailVerifiedAt: new Date() },
    );
  }

  /** Rỗng, null hoặc không gửi = không có số. Sai định dạng = 400. */
  private resolvePhone(input: string | null | undefined): string | null {
    if (!input?.trim()) {
      return null;
    }
    const phone = normalizePhone(input);
    if (!phone) {
      throw new BadRequestException('phone is not a valid Vietnam number');
    }
    return phone;
  }

  async updateMe(
    accountId: string,
    dto: UpdateMeDto,
  ): Promise<AuthenticatedAccount> {
    const account = await this.authRepository.findOneBy({ id: accountId });
    if (!account) {
      throw new NotFoundException('account not found');
    }

    if (dto.name !== undefined) {
      account.name = dto.name.trim();
    }
    if (dto.phone !== undefined) {
      account.phone = this.resolvePhone(dto.phone);
    }
    if (dto.accountRole !== undefined) {
      await this.ensureProfileFor(account, dto.accountRole);
      account.accountRole = dto.accountRole;
    }

    try {
      const saved = await this.authRepository.save(account);
      await this.accountCache.invalidate(saved.id);
      const { password: _password, ...result } = saved;
      return result;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code ===
          PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException('phone already exists');
      }
      throw error;
    }
  }

  /** Tạo hồ sơ cho vai trò đích nếu chưa có. Hồ sơ cũ không bị đụng tới. */
  private async ensureProfileFor(
    account: AuthEntity,
    role: ERole.BRAND | ERole.CREATOR,
  ): Promise<void> {
    const service =
      role === ERole.BRAND
        ? this.brandProfileService
        : this.creatorProfileService;

    const existing = await service.findByAccountId(account.id);
    if (!existing) {
      await service.create(account.id, account.name, account.email);
    }
  }

  async findById(id: string): Promise<AuthEntity | null> {
    return this.authRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<AuthEntity | null> {
    return this.authRepository.findOneBy({
      email: email.trim().toLowerCase(),
    });
  }

  /** password bị `select: false` trên entity nên phải addSelect thủ công. */
  private findByEmailWithPassword(email: string): Promise<AuthEntity | null> {
    return this.authRepository
      .createQueryBuilder('account')
      .addSelect('account.password')
      .where('account.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
  }

  async validateAccount(
    email: string,
    password: string,
  ): Promise<AuthenticatedAccount> {
    const account = await this.findByEmailWithPassword(email);
    // password null = tài khoản chỉ có Google. Trả đúng thông điệp như sai mật
    // khẩu: nói "tài khoản này dùng Google" là để lộ email nào đã đăng ký.
    if (
      !account ||
      account.password === null ||
      !(await bcrypt.compare(password, account.password))
    ) {
      // Email lạ (account null) không ghi: chưa biết vai trò thì không có cơ sở
      // coi là admin. Đổi lại, dò mật khẩu vào email admin không tồn tại sẽ
      // không để lại vết ở đây.
      await this.auditLogService.writeIfAdmin(account?.accountRole, {
        category: EAuditLogCategory.LOGIN,
        action: ELoginAction.FAIL_CREDENTIALS,
        accountId: account?.id ?? null,
        emailAttempted: email.trim().toLowerCase(),
      });
      throw new UnauthorizedException('invalid credentials');
    }

    if (
      account.status === EAccountStatus.SUSPENDED ||
      account.status === EAccountStatus.BANNED
    ) {
      throw new ForbiddenException(
        account.statusReason ?? `account is ${account.status}`,
      );
    }

    const { password: _password, ...result } = account;
    return result;
  }

  // TODO(google): SocialProfile và googleOAuthService chưa tồn tại nên hai
  // hàm dưới chưa compile được. Giữ nguyên làm bản phác, mở lại khi dựng xong
  // ba tầng Google.
  //
  // async socialLogin(input: SocialProfile) {}
  //
  // async loginWithGoogle(code: string) {
  //   const googleToken = await this.googleOAuthService.exchangeCode(code);
  //   const profile = await this.googleOAuthService.getProfile(
  //     googleToken.accessToken,
  //   );
  //   return this.socialLogin({
  //     provider: 'google',
  //     providerUserId: profile.sub,
  //     email: profile.email,
  //     displayName: profile.name,
  //     avatarUrl: profile.picture,
  //   });
  // }
}
