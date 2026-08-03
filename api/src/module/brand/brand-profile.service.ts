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
import { BrandProfile } from './entities/brand-profile.entity';
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto';

/** Tên constraint đúng như migration đặt; đổi tên ở đó phải sửa cả ở đây. */
const TAX_CODE_CONSTRAINT = 'UQ_brand_profiles_tax_code';

@Injectable()
export class BrandProfileService {
  constructor(
    @InjectRepository(BrandProfile)
    private readonly brandRepository: Repository<BrandProfile>,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
  ) {}

  create(
    accountId: string,
    name: string | null,
    email: string,
  ): Promise<BrandProfile> {
    return this.brandRepository.save(
      this.brandRepository.create({ accountId, brandName: name, email }),
    );
  }

  findByAccountId(accountId: string): Promise<BrandProfile | null> {
    return this.brandRepository.findOneBy({ accountId });
  }

  @Transactional()
  async update(
    accountId: string,
    dto: UpdateBrandProfileDto,
  ): Promise<BrandProfile> {
    const profile = await this.brandRepository.findOneBy({ accountId });
    if (!profile) {
      throw new NotFoundException('profile not found');
    }

    // undefined = client không gửi field đó => giữ nguyên.
    // null = client chủ động xoá giá trị => ghi null.
    if (dto.brandName !== undefined) profile.brandName = dto.brandName;
    if (dto.companyName !== undefined) profile.companyName = dto.companyName;
    if (dto.taxCode !== undefined) profile.taxCode = dto.taxCode;
    if (dto.phone !== undefined) profile.phone = dto.phone;
    if (dto.website !== undefined) profile.website = dto.website;
    if (dto.industry !== undefined) profile.industry = dto.industry;
    if (dto.logoUrl !== undefined) profile.logoUrl = dto.logoUrl;
    if (dto.description !== undefined) profile.description = dto.description;
    if (dto.address !== undefined) profile.address = dto.address;
    if (dto.contactName !== undefined) profile.contactName = dto.contactName;
    if (dto.contactPhone !== undefined) profile.contactPhone = dto.contactPhone;
    if (dto.timezone !== undefined) profile.timezone = dto.timezone;

    try {
      if (dto.email !== undefined) {
        const email = dto.email.trim().toLowerCase();
        profile.email = email;
        // accounts mới là nguồn gốc của email (UNIQUE nằm ở bảng đó).
        await this.authRepository.update({ id: accountId }, { email });
      }

      return await this.brandRepository.save(profile);
    } catch (error) {
      // Bảng này có HAI ràng buộc duy nhất đi qua cùng chỗ bắt lỗi, nên phải
      // phân biệt bằng tên constraint. Chỉ nhìn mã 23505 sẽ báo "email trùng"
      // cho cả trường hợp trùng mã số thuế.
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
}
