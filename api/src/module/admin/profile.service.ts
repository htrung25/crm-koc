import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { AuthEntity } from '../auth/entities/auth.entity';
import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
  ) {}

  async createProfile(accountId: string, name: string | null, email: string) {
    const profile = this.profileRepository.create({ accountId, name, email });
    return this.profileRepository.save(profile);
  }

  async findByAccountId(accountId: string): Promise<Profile | null> {
    return this.profileRepository.findOneBy({ accountId });
  }

  @Transactional()
  async updateProfile(
    accountId: string,
    dto: UpdateProfileDto,
  ): Promise<Profile> {
    // chỉ accountId mới là điều kiện tìm; các field khác là dữ liệu cần ghi
    const profile = await this.profileRepository.findOneBy({ accountId });
    if (!profile) {
      throw new NotFoundException('profile not found');
    }

    // undefined = client không gửi field đó => giữ nguyên.
    // null = client chủ động xoá giá trị => ghi null.
    if (dto.name !== undefined) profile.name = dto.name;
    if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
    if (dto.address !== undefined) profile.address = dto.address;
    if (dto.gender !== undefined) profile.gender = dto.gender;
    if (dto.timezone !== undefined) profile.timezone = dto.timezone;

    try {
      if (dto.email !== undefined) {
        const email = dto.email.trim().toLowerCase();
        profile.email = email;
        // accounts mới là nguồn gốc của email (UNIQUE nằm ở bảng đó).
        // Lệnh này nằm trong try vì chính nó là chỗ ném unique violation.
        await this.authRepository.update({ id: accountId }, { email });
      }

      return await this.profileRepository.save(profile);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code ===
          PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException('email already exists');
      }
      throw error;
    }
  }
}
