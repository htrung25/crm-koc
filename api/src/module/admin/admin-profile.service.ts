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
import { AdminProfileResponseDto } from './dto/admin-profile-response.dto';
import { ChangePasswordDto } from '../../common/dto/change-password.dto';
import { BCRYPT_ROUNDS } from '../../common/util/account.util';
import { SessionService } from '../../security/session.service';
import { AccountCacheService } from '../../security/account-cache.service';
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
    private readonly accountCache: AccountCacheService,
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

  private static readonly PROFILE_COLUMNS = {
    accountId: true,
    name: true,
    email: true,
    avatarUrl: true,
    timezone: true,
    updatedAt: true,
  } as const;

  async findByAccountId(
    accountId: string,
  ): Promise<AdminProfileResponseDto | null> {
    return this.adminRepository.findOne({
      where: { accountId },
      select: AdminProfileService.PROFILE_COLUMNS,
    });
  }

  async update(
    accountId: string,
    dto: UpdateAdminProfileDto,
  ): Promise<AdminProfileResponseDto> {
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

    let emailChanged = false;
    try {
      if (dto.email !== undefined) {
        const email = dto.email.trim().toLowerCase();
        emailChanged = profile.email !== email;
        profile.email = email;
        // accounts mới là nguồn gốc của email (UNIQUE nằm ở bảng đó).
        await this.authRepository.update({ id: accountId }, { email });
      }

      await this.adminRepository.save(profile);
    } catch (error) {
      if (uniqueViolationOf(error) !== null) {
        throw new ConflictException('email already exists');
      }
      throw error;
    }

    if (emailChanged) {
      await this.accountCache.invalidate(accountId);
    }

    // Đọc lại qua đường đã lọc cột: save() trả về entity đầy đủ, trả thẳng
    // sẽ lộ ipWhitelist và adminRole.
    return this.adminRepository.findOneOrFail({
      where: { accountId },
      select: AdminProfileService.PROFILE_COLUMNS,
    });
  }

  async changePassword(
    accountId: string,
    dto: ChangePasswordDto,
    currentSessionId?: string,
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

    // Tài khoản chỉ đăng nhập bằng Google thì chưa có mật khẩu để đối chiếu.
    if (account.password === null) {
      throw new BadRequestException('account has no password set');
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
    // refresh token của kẻ tấn công còn sống tiếp 7 ngày. Giữ lại phiên đang
    // gọi để admin không tự đăng xuất mình.
    const revoked = await this.sessionService.deleteAllByAccount(
      accountId,
      currentSessionId,
    );
    this.logger.warn(
      `Admin ${accountId} đổi mật khẩu, huỷ ${revoked} phiên khác`,
    );

    return { message: 'Password changed successfully.' };
  }
}
