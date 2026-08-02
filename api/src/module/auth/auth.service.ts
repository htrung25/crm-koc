import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ERole } from '../../common/enum/roles.enum';
import { EAccountStatus } from '../../common/enum/account-statuses.enum';
import { Transactional } from 'typeorm-transactional';
import { normalizePhone } from '../../common/util/account.util';
import { ProfileService } from '../admin/profile.service';
import { AuthEntity } from './entities/auth.entity';
import { AuthenticatedAccount } from './entities/authenticated.entity';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;
const PG_UNIQUE_VIOLATION = '23505';

/**
 * Role được phép tạo qua đăng ký công khai.
 * Cố tình KHÔNG có ADMIN: truyền ERole.ADMIN vào createAuth() sẽ
 * không compile được. Admin chỉ được tạo bởi admin khác.
 */
export type PublicRole = ERole.BRAND | ERole.CREATOR;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly profileService: ProfileService,
  ) {}

  createAccountUser(
    dto: RegisterDto,
    role: PublicRole,
  ): Promise<AuthenticatedAccount> {
    return this.createAccount(dto, role);
  }

  createAdminAccount(dto: RegisterDto): Promise<AuthenticatedAccount> {
    return this.createAccount(dto, ERole.ADMIN);
  }

  @Transactional()
  private async createAccount(
    dto: RegisterDto,
    role: ERole,
  ): Promise<AuthenticatedAccount> {
    // Không kiểm tra rỗng ở đây nữa: @IsNotEmpty/@IsEmail/@MinLength trong
    // RegisterDto đã chặn từ tầng ValidationPipe.

    let phone: string | null = null;
    if (dto.phone?.trim()) {
      phone = normalizePhone(dto.phone);
      if (!phone) {
        throw new BadRequestException('phone is not a valid Vietnam number');
      }
    }

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
      await this.profileService.createProfile(
        saved.id,
        saved.name,
        saved.email,
      );
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

  findById(id: string): Promise<AuthEntity | null> {
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
    if (!account || !(await bcrypt.compare(password, account.password))) {
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
}
