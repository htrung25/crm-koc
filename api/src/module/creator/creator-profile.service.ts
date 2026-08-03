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
import { CreatorProfile } from './entities/creator-profile.entity';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';

@Injectable()
export class CreatorProfileService {
  constructor(
    @InjectRepository(CreatorProfile)
    private readonly creatorRepository: Repository<CreatorProfile>,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
  ) {}

  create(
    accountId: string,
    name: string | null,
    email: string,
  ): Promise<CreatorProfile> {
    return this.creatorRepository.save(
      this.creatorRepository.create({ accountId, displayName: name, email }),
    );
  }

  findByAccountId(accountId: string): Promise<CreatorProfile | null> {
    return this.creatorRepository.findOneBy({ accountId });
  }

  @Transactional()
  async update(
    accountId: string,
    dto: UpdateCreatorProfileDto,
  ): Promise<CreatorProfile> {
    const profile = await this.creatorRepository.findOneBy({ accountId });
    if (!profile) {
      throw new NotFoundException('profile not found');
    }

    // undefined = client không gửi field đó => giữ nguyên.
    // null = client chủ động xoá giá trị => ghi null.
    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.phone !== undefined) profile.phone = dto.phone;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
    if (dto.dateOfBirth !== undefined) profile.dateOfBirth = dto.dateOfBirth;
    if (dto.gender !== undefined) profile.gender = dto.gender;
    if (dto.city !== undefined) profile.city = dto.city;
    if (dto.address !== undefined) profile.address = dto.address;
    if (dto.contentCategories !== undefined) {
      profile.contentCategories = dto.contentCategories;
    }
    if (dto.portfolioUrl !== undefined) profile.portfolioUrl = dto.portfolioUrl;
    if (dto.timezone !== undefined) profile.timezone = dto.timezone;

    try {
      if (dto.email !== undefined) {
        const email = dto.email.trim().toLowerCase();
        profile.email = email;
        // accounts mới là nguồn gốc của email (UNIQUE nằm ở bảng đó).
        await this.authRepository.update({ id: accountId }, { email });
      }

      return await this.creatorRepository.save(profile);
    } catch (error) {
      // creator_profiles không có ràng buộc duy nhất riêng, nên 23505 đi qua
      // đây chỉ có thể đến từ accounts.email.
      if (uniqueViolationOf(error) !== null) {
        throw new ConflictException('email already exists');
      }
      throw error;
    }
  }
}
