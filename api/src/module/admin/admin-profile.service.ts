import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { AuthEntity } from '../auth/entities/auth.entity';
import { uniqueViolationOf } from '../../common/util/pg-error.util';
import { AdminUser } from './entities/admin-user.entity';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

/**
 * Chỉ phục vụ admin. Hồ sơ brand và creator do BrandProfileService và
 * CreatorProfileService của module tương ứng quản lý — mỗi vai trò một bảng,
 * một bộ cột, nên gom vào một service sẽ thành nơi chứa cả ba lược đồ.
 */
@Injectable()
export class AdminProfileService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepository: Repository<AdminUser>,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
  ) { }

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

  @Transactional()
  async update(
    accountId: string,
    dto: UpdateAdminProfileDto,
  ): Promise<AdminUser> {
    const profile = await this.adminRepository.findOneBy({ accountId });
    if (!profile) {
      throw new NotFoundException('profile not found');
    }

    // undefined = client không gửi field đó => giữ nguyên.
    // null = client chủ động xoá giá trị => ghi null.
    if (dto.name !== undefined) profile.name = dto.name;
    if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
    if (dto.timezone !== undefined) profile.timezone = dto.timezone;

    try {
      if (dto.email !== undefined) {
        const email = dto.email.trim().toLowerCase();
        profile.email = email;
        // accounts mới là nguồn gốc của email (UNIQUE nằm ở bảng đó).
        await this.authRepository.update({ id: accountId }, { email });
      }

      return await this.adminRepository.save(profile);
    } catch (error) {
      // admin_users không có ràng buộc duy nhất riêng ngoài khoá chính, nên
      // 23505 đi qua đây chỉ có thể đến từ accounts.email.
      if (uniqueViolationOf(error) !== null) {
        throw new ConflictException('email already exists');
      }
      throw error;
    }
  }
}
