import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthEntity } from '../auth/entities/auth.entity';
import { uniqueViolationOf } from '../../common/util/pg-error.util';
import { CreatorProfile } from './entities/creator-profile.entity';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import { CreatorProfileResponseDto } from './dto/creator-profile-response.dto';

@Injectable()
export class CreatorProfileService {
  constructor(
    @InjectRepository(CreatorProfile)
    private readonly creatorRepository: Repository<CreatorProfile>,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
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

    try {
      if (dto.email !== undefined) {
        const email = dto.email.trim().toLowerCase();
        profile.email = email;
        // accounts mới là nguồn gốc của email (UNIQUE nằm ở bảng đó).
        await this.authRepository.update({ id: accountId }, { email });
      }

      return await this.creatorRepository.save(profile);
    } catch (error) {
      if (uniqueViolationOf(error) !== null) {
        throw new ConflictException('email already exists');
      }
      throw error;
    }
  }
}
