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
import { BCRYPT_ROUNDS } from '../../common/util/account.util';
import { ChangePasswordDto } from '../../common/dto/change-password.dto';
import { SessionService } from '../../security/session.service';
import { AccountCacheService } from '../../security/account-cache.service';
import * as bcrypt from 'bcrypt';
import { CreatorProfile } from './entities/creator-profile.entity';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import { CreatorProfileResponseDto } from './dto/creator-profile-response.dto';

@Injectable()
export class CreatorProfileService {
  private readonly logger = new Logger(CreatorProfileService.name);

  constructor(
    @InjectRepository(CreatorProfile)
    private readonly creatorRepository: Repository<CreatorProfile>,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly sessionService: SessionService,
    private readonly accountCache: AccountCacheService,
  ) {}

  async create(
    accountId: string,
    name: string | null,
    email: string,
  ): Promise<CreatorProfileResponseDto> {
    const newProfile = this.creatorRepository.create({
      accountId,
      displayName: name,
      email,
    });
    return this.creatorRepository.save(newProfile);
  }

  async findByAccountId(
    accountId: string,
  ): Promise<CreatorProfileResponseDto | null> {
    return this.creatorRepository.findOneBy({ accountId });
  }

  async update(
    accountId: string,
    dto: UpdateCreatorProfileDto,
  ): Promise<CreatorProfileResponseDto> {
    const profile = await this.creatorRepository.findOneBy({ accountId });
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
    let saved: CreatorProfileResponseDto;
    try {
      if (dto.email !== undefined) {
        const email = dto.email.trim().toLowerCase();
        emailChanged = profile.email !== email;
        profile.email = email;
        // accounts mới là nguồn gốc của email (UNIQUE nằm ở bảng đó).
        await this.authRepository.update({ id: accountId }, { email });
      }

      saved = await this.creatorRepository.save(profile);
    } catch (error) {
      if (uniqueViolationOf(error) !== null) {
        throw new ConflictException('email already exists');
      }
      throw error;
    }

    if (emailChanged) {
      await this.accountCache.invalidate(accountId);
    }

    return saved;
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

    // Đổi mật khẩu thường vì nghi bị chiếm tài khoản; giữ lại phiên đang gọi
    // để người dùng không tự đăng xuất mình.
    const revoked = await this.sessionService.deleteAllByAccount(
      accountId,
      currentSessionId,
    );
    this.logger.warn(
      `Creator ${accountId} đổi mật khẩu, huỷ ${revoked} phiên khác`,
    );

    return { message: 'Password changed successfully.' };
  }
}
