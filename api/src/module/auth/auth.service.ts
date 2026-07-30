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
import { EAccountRole } from 'src/common/enum/account-roles.enum';
import { EAccountStatus } from 'src/common/enum/account-statuses.enum';
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
  ) {}

  async createAuth(dto: RegisterDto): Promise<AuthenticatedAuth> {
    if (!dto?.email || !dto?.password) {
      throw new BadRequestException('email and password are required');
    }

    const auth = this.authRepository.create({
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone ?? null,
      accountRole: dto.accountRole ?? EAccountRole.CREATOR,
      status: EAccountStatus.PENDING,
      password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    });

    try {
      const saved = await this.authRepository.save(auth);
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

  findByEmail(email: string): Promise<AuthEntity | null> {
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

  async login(auth: AuthenticatedAuth) {
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
}
