import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthEntity } from '../auth/entities/auth.entity';
import { uniqueViolationOf } from '../../common/util/pg-error.util';
import { AdminUser } from './entities/admin-user.entity';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { BCRYPT_ROUNDS } from '../../common/util/account.util';
import { SessionService } from '../../security/session.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminProfileService {
  private readonly logger = new Logger(AdminProfileService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepository: Repository<AdminUser>,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Dòng admin_users có thể đã tồn tại (superadmin dựng bằng SQL, hoặc
   * migration đã nạp sẵn), nên ghi đè phần hồ sơ thay vì insert mù.
   */
  async create(
    accountId: string,
    name: string | null,
    email: string,
  ): Promise<AdminUser> {
    await this.adminRepository.upsert(
      { accountId, name, email },
      { conflictPaths: ['accountId'] },
    );
    return this.adminRepository.findOneByOrFail({ accountId });
  }

  async findByAccountId(accountId: string): Promise<AdminUser | null> {
    return this.adminRepository.findOneBy({ accountId });
  }

  async update(
    accountId: string,
    dto: UpdateAdminProfileDto,
  ): Promise<AdminUser> {
    const profile = await this.adminRepository.findOneBy({ accountId });
    if (!profile) {
      throw new NotFoundException('profile not found');
    }

    const { email: _email, ...fields } = dto;
    Object.assign(
      profile,
      Object.fromEntries(
        Object.entries(fields).filter(([, value]) => value !== undefined),
      ),
    );

    try {
      if (dto.email !== undefined) {
        const email = dto.email.trim().toLowerCase();
        profile.email = email;
        // accounts mới là nguồn gốc của email (UNIQUE nằm ở bảng đó).
        await this.authRepository.update({ id: accountId }, { email });
      }

      return await this.adminRepository.save(profile);
    } catch (error) {
      if (uniqueViolationOf(error) !== null) {
        throw new ConflictException('email already exists');
      }
      throw error;
    }
  }

  async changePassword(
    accountId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { oldPassword, newPassword } = dto;

    // password khai select: false nên phải chỉ định tường minh.
    const account = await this.authRepository.findOne({
      where: { id: accountId },
      select: { id: true, password: true },
    });
    if (!account) {
      throw new NotFoundException('account not found');
    }

    // 401 chứ không phải 404: tài khoản có tồn tại, chỉ là xác thực lại sai.
    if (!(await bcrypt.compare(oldPassword, account.password))) {
      throw new UnauthorizedException('current password is incorrect');
    }
    if (await bcrypt.compare(newPassword, account.password)) {
      throw new BadRequestException(
        'new password must differ from the current one',
      );
    }

    await this.authRepository.update(accountId, {
      password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
    });

    // Người ta đổi mật khẩu vì nghi bị chiếm tài khoản. Không huỷ phiên thì
    // refresh token của kẻ tấn công còn sống tiếp 7 ngày.
    const revoked = await this.sessionService.deleteAllByAccount(accountId);
    this.logger.warn(`Admin ${accountId} đổi mật khẩu, huỷ ${revoked} phiên`);

    return { message: 'Password changed successfully.' };
  }
}
