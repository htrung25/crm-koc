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
import {
  isForeignKeyViolation,
  uniqueViolationOf,
} from '../../common/util/pg-error.util';
import { BCRYPT_ROUNDS } from '../../common/util/account.util';
import { ChangePasswordDto } from '../../common/dto/change-password.dto';
import { AccountCacheService } from '../../security/account-cache.service';
import { SessionService } from '../../security/session.service';
import * as bcrypt from 'bcrypt';
import { BrandProfile } from './entities/brand-profile.entity';
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto';
import { BrandProfileResponseDto } from './dto/brand-profile-response.dto';

/** Tên constraint đúng như migration đặt; đổi tên ở đó phải sửa cả ở đây. */
const TAX_CODE_CONSTRAINT = 'UQ_brand_profiles_tax_code';

@Injectable()
export class BrandProfileService {
  private readonly logger = new Logger(BrandProfileService.name);

  constructor(
    @InjectRepository(BrandProfile)
    private readonly brandRepository: Repository<BrandProfile>,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly sessionService: SessionService,
    private readonly accountCache: AccountCacheService,
  ) {}

  async create(
    accountId: string,
    name: string | null,
    email: string,
  ): Promise<BrandProfile> {
    return this.brandRepository.save(
      this.brandRepository.create({ accountId, brandName: name, email }),
    );
  }

  // Entity trả thẳng: 15 cột của brand_profiles khớp đúng BrandProfileResponseDto,
  // và quan hệ `account` không được load nên không lọt ra. Join `account` vào
  // thì phải lọc lại bằng select.
  async findByAccountId(
    accountId: string,
  ): Promise<BrandProfileResponseDto | null> {
    return this.brandRepository.findOneBy({ accountId });
  }

  async update(
    accountId: string,
    dto: UpdateBrandProfileDto,
  ): Promise<BrandProfileResponseDto> {
    const result = await this.updateInTransaction(accountId, dto);

    // updateInTransaction đã commit xong tại đây; không tạo cửa sổ cache miss
    // đọc lại email cũ khi transaction còn chưa hoàn tất.
    if (result.emailChanged) {
      await this.accountCache.invalidate(accountId);
    }

    return result.profile;
  }

  private async updateInTransaction(
    accountId: string,
    dto: UpdateBrandProfileDto,
  ): Promise<{
    profile: BrandProfileResponseDto;
    emailChanged: boolean;
  }> {
    const profile = await this.brandRepository.findOneBy({ accountId });
    if (!profile) {
      throw new NotFoundException('profile not found');
    }

    // undefined = client không gửi => giữ nguyên. null = chủ động xoá.
    // email tách riêng vì phải chuẩn hoá và ghi thêm sang accounts.
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

      const saved = await this.brandRepository.save(profile);
      return { profile: saved, emailChanged };
    } catch (error) {
      const constraint = uniqueViolationOf(error);
      if (constraint === TAX_CODE_CONSTRAINT) {
        throw new ConflictException('tax code already exists');
      }
      if (constraint !== null) {
        throw new ConflictException('email already exists');
      }
      throw error;
    }
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

    const revoked = await this.sessionService.deleteAllByAccount(
      accountId,
      currentSessionId,
    );
    this.logger.warn(
      `Brand ${accountId} đổi mật khẩu, huỷ ${revoked} phiên khác`,
    );

    return { message: 'Password changed successfully.' };
  }

  /** Xoá tài khoản gốc; FK CASCADE tự dọn brand_profiles. */
  async remove(accountId: string): Promise<{ message: string }> {
    const account = await this.authRepository.findOneBy({ id: accountId });
    if (!account) {
      throw new NotFoundException('account not found');
    }

    try {
      await this.authRepository.delete(accountId);
    } catch (error) {
      // collaborations.brand_id là RESTRICT: còn hợp tác thì không xoá được.
      if (isForeignKeyViolation(error)) {
        throw new ConflictException(
          'account still has collaborations and cannot be deleted',
        );
      }
      throw error;
    }

    // Token cũ vẫn qua được JwtStrategy tới khi cache hết hạn nếu bỏ hai dòng này.
    await this.accountCache.invalidate(accountId);
    await this.sessionService.deleteAllByAccount(accountId);
    this.logger.warn(`Brand ${accountId} đã tự xoá tài khoản`);

    return { message: 'Delete Brand account success' };
  }
}
