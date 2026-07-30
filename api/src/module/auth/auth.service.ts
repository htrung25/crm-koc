import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EAccountRole } from '../../common/enum/account-roles.enum';
import { EAccountStatus } from '../../common/enum/account-statuses.enum';
import { Transactional } from 'typeorm-transactional';
import { normalizePhone } from '../../common/util/phone.util';
import { ProfileService } from '../admin/profile.service';
import { AuthEntity } from './entities/auth.entity';
import { AuthenticatedAuth, JwtPayload } from './entities/authenticated.entity';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly jwtService: JwtService,
    private readonly profileService: ProfileService,
  ) {}

  /**
   * Tạo account + profile rỗng. @Transactional() bọc cả hai lệnh insert:
   * nếu tạo profile lỗi thì account cũng bị rollback.
   */
  @Transactional()
  async createAuth(dto: RegisterDto): Promise<AuthenticatedAuth> {
    if (!dto?.email || !dto?.password || !dto?.name?.trim()) {
      throw new BadRequestException('name, email and password are required');
    }

    let phone: string | null = null;
    if (dto.phone?.trim()) {
      phone = normalizePhone(dto.phone);
      if (!phone) {
        throw new BadRequestException('phone is not a valid Vietnam number');
      }
    }

    const auth = this.authRepository.create({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone,
      accountRole: dto.accountRole ?? EAccountRole.ADMIN,
      status: EAccountStatus.PENDING,
      password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    });

    try {
      const saved = await this.authRepository.save(auth);
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

  async loginAuth(auth: AuthenticatedAuth) {
    const payload: JwtPayload = {
      sub: auth.id,
      email: auth.email,
      role: auth.accountRole,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      account: {
        id: auth.id,
        email: auth.email,
        accountRole: auth.accountRole,
        status: auth.status,
      },
    };
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
      .createQueryBuilder('auth')
      .addSelect('auth.password')
      .where('auth.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
  }

  async validateAuth(
    email: string,
    password: string,
  ): Promise<AuthenticatedAuth> {
    const auth = await this.findByEmailWithPassword(email);
    if (!auth || !(await bcrypt.compare(password, auth.password))) {
      throw new UnauthorizedException('invalid credentials');
    }

    if (
      auth.status === EAccountStatus.SUSPENDED ||
      auth.status === EAccountStatus.BANNED
    ) {
      throw new ForbiddenException(
        auth.statusReason ?? `account is ${auth.status}`,
      );
    }

    const { password: _password, ...result } = auth;
    return result;
  }
}
