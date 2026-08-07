import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { ERole } from '../../common/enum/roles.enum';
import { EAccountSortField } from '../../common/enum/sort-fields.enum';
import { EAccountStatus } from '../../common/enum/account-statuses.enum';
import { ESortOrder } from '../../common/enum/sort-fields.enum';
import {
  PaginatedResult,
  escapeLike,
  paginate,
} from '../../common/util/pagination.util';
import { AccountCacheService } from '../../security/account-cache.service';
import { AuthEntity } from '../auth/entities/auth.entity';
import { AuthenticatedAccount } from '../auth/entities/authenticated.entity';
import { AccountFilterDto } from './dto/account-filters.dto';
import { AdminFilters } from './dto/admin-filters.dto';
import { BrandFilterDto } from './dto/brand-filters.dto';
import { CreatorFilterDto } from './dto/creator-filters.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { EAdminRole } from './enum/admin-roles.enum';
import { AdminUser } from './entities/admin_user.entity';
import { IpWhitelistService } from './ip-whitelist.service';
import { uniqueViolationOf } from '../../common/util/pg-error.util';

const ACCOUNT_LIST_FIELDS = [
  'id',
  'name',
  'email',
  'phone',
  'accountRole',
  'status',
  'createdAt',
] as const;

/**
 * Dòng trong danh sách admin: account kèm whitelist và adminRole lấy từ
 * admin_users. ipWhitelist null nghĩa là KHÔNG giới hạn IP, không phải chặn hết.
 *
 * adminRole có mặt ở đây để danh sách hiện được huy hiệu super admin mà không
 * phải gọi thêm GET /admin/:id cho từng dòng.
 */
export type AdminListRow = AuthEntity & {
  ipWhitelist: string | null;
  adminRole: EAdminRole;
};

/** Kiểu của một dòng trong danh sách: đúng bằng các cột đã select. */
export type AccountListItem = Pick<
  AuthEntity,
  (typeof ACCOUNT_LIST_FIELDS)[number]
>;

function assertNumericEnum<T extends Record<string, string | number>>(
  enumType: T,
  value: unknown,
  field: string,
): T[keyof T] {
  const allowed = Object.values(enumType).filter(
    (v): v is number => typeof v === 'number',
  );
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || !allowed.includes(parsed)) {
    throw new BadRequestException(
      `${field} must be one of: ${allowed.join(', ')}`,
    );
  }
  return parsed as T[keyof T];
}

/** Kiểm tra giá trị có nằm trong enum không, để dùng lại cho cả 3 field. */
function assertEnum<T extends Record<string, string>>(
  enumType: T,
  value: unknown,
  field: string,
): T[keyof T] {
  const allowed = Object.values(enumType);
  if (!allowed.includes(value as string)) {
    throw new BadRequestException(
      `${field} must be one of: ${allowed.join(', ')}`,
    );
  }
  return value as T[keyof T];
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    // Chỉ để đồng bộ bản sao email trong admin_users khi accounts.email đổi.
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    private readonly accountCache: AccountCacheService,
    private readonly ipWhitelistService: IpWhitelistService,
  ) {}

  async findAll(query: AdminFilters): Promise<PaginatedResult<AdminListRow>> {
    const qb = this.authRepository
      .createQueryBuilder('account')
      .where('account.accountRole = :role', { role: ERole.ADMIN });

    if (query.search?.trim()) {
      qb.andWhere('(account.name ILIKE :s OR account.email ILIKE :s)', {
        s: `%${escapeLike(query.search.trim())}%`,
      });
    }

    if (query.status !== undefined) {
      const status = assertNumericEnum(EAccountStatus, query.status, 'status');
      qb.andWhere('account.status = :status', { status });
    }

    const sortBy =
      query.sortBy === undefined
        ? EAccountSortField.CREATED_AT
        : assertEnum(EAccountSortField, query.sortBy, 'sortBy');
    const sortOrder =
      query.sortOrder === undefined
        ? ESortOrder.DESC
        : assertEnum(ESortOrder, query.sortOrder, 'sortOrder');

    qb.orderBy(`account.${sortBy}`, sortOrder);
    // khoá thứ tự bằng id để phân trang ổn định khi nhiều dòng trùng giá trị sort
    qb.addOrderBy('account.id', ESortOrder.ASC);

    const page = await paginate(qb, query);

    // Một truy vấn cho cả trang thay vì đọc từng dòng => tránh N+1.
    const securityInfo = await this.ipWhitelistService.getManyByAdminIds(
      page.data.map((account) => account.id),
    );

    return {
      ...page,
      data: page.data.map((account) => {
        // Vắng dòng admin_users = admin thường, không giới hạn IP. Giống hệt
        // fail-safe của getSecurityInfo, không phải 404.
        const info = securityInfo.get(account.id);
        return {
          ...account,
          ipWhitelist: info?.ipWhitelist ?? null,
          adminRole: info?.adminRole ?? EAdminRole.ADMIN,
        };
      }),
    };
  }

  /** Danh sách brand, phân trang + lọc. */
  async findAllBrands(
    query: BrandFilterDto,
  ): Promise<PaginatedResult<AccountListItem>> {
    return this.listByRole(ERole.BRAND, query);
  }

  /** Danh sách creator, phân trang + lọc. */
  async findAllCreators(
    query: CreatorFilterDto,
  ): Promise<PaginatedResult<AccountListItem>> {
    return this.listByRole(ERole.CREATOR, query);
  }

  private listByRole(
    role: ERole,
    // hợp của 2 DTO con: field riêng của bên nào cũng optional nên nhánh
    // tương ứng chỉ chạy khi client thực sự gửi
    query: AccountFilterDto & Partial<BrandFilterDto & CreatorFilterDto>,
  ): Promise<PaginatedResult<AccountListItem>> {
    const qb = this.authRepository
      .createQueryBuilder('account')
      .select(ACCOUNT_LIST_FIELDS.map((f) => `account.${f}`))
      .where('account.accountRole = :role', { role });

    if (query.search?.trim()) {
      qb.andWhere('(account.name ILIKE :s OR account.email ILIKE :s)', {
        s: `%${escapeLike(query.search.trim())}%`,
      });
    }

    if (query.status !== undefined) {
      qb.andWhere('account.status = :status', {
        status: assertNumericEnum(EAccountStatus, query.status, 'status'),
      });
    }

    if (query.emailVerified !== undefined) {
      qb.andWhere(
        // @Transform trong AccountFilterDto đã đổi 'true'/'false' thành boolean
        query.emailVerified
          ? 'account.emailVerifiedAt IS NOT NULL'
          : 'account.emailVerifiedAt IS NULL',
      );
    }

    if (query.createdFrom) {
      qb.andWhere('account.createdAt >= :from', { from: query.createdFrom });
    }
    if (query.createdTo) {
      const to = new Date(query.createdTo);
      to.setDate(to.getDate() + 1);
      qb.andWhere('account.createdAt < :to', { to });
    }
    if (query.address?.trim() || query.gender !== undefined) {
      // Mỗi vai trò một bảng profile riêng; listByRole chỉ chạy cho brand và
      // creator nên hai nhánh này là đủ.
      qb.leftJoin(
        role === ERole.BRAND ? 'brand_profiles' : 'creator_profiles',
        'profile',
        'profile.account_id = account.id',
      );

      if (query.address?.trim()) {
        qb.andWhere('profile.address ILIKE :addr', {
          addr: `%${escapeLike(query.address.trim())}%`,
        });
      }

      if (query.gender !== undefined) {
        // @Type(() => Number) + @IsEnum(GendersEnum) trong CreatorFilterDto
        // đã ép kiểu và chặn giá trị ngoài 1/2/3
        qb.andWhere('profile.gender = :gender', { gender: query.gender });
      }
    }

    // orderBy ghép chuỗi raw vào SQL => bắt buộc whitelist, không tin input
    const sortBy =
      query.sortBy === undefined
        ? EAccountSortField.CREATED_AT
        : assertEnum(EAccountSortField, query.sortBy, 'sortBy');
    const sortOrder =
      query.sortOrder === undefined
        ? ESortOrder.DESC
        : assertEnum(ESortOrder, query.sortOrder, 'sortOrder');

    qb.orderBy(`account.${sortBy}`, sortOrder);
    // khoá thứ tự bằng id để phân trang ổn định khi trùng giá trị sort
    qb.addOrderBy('account.id', ESortOrder.ASC);

    return paginate(qb, query);
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
  ): Promise<AuthenticatedAccount> {
    const account = await this.authRepository.findOneBy({ id });
    if (!account) {
      throw new NotFoundException('account not found');
    }

    account.status = assertNumericEnum(EAccountStatus, dto.status, 'status');
    if (dto.statusReason !== undefined) {
      account.statusReason = dto.statusReason;
    }

    const saved = await this.authRepository.save(account);
    await this.accountCache.invalidate(id);

    const { password: _password, ...result } = saved;
    return result;
  }

  async findAdminById(
    id: string,
  ): Promise<
    AuthenticatedAccount & { ipWhitelist: string | null; adminRole: EAdminRole }
  > {
    const account = await this.requireAdmin(id);
    // MỘT truy vấn admin_users duy nhất lấy cả adminRole lẫn whitelist.
    // Không có dòng => admin thường, KHÔNG giới hạn IP (không phải 404):
    // getSecurityInfo() đã tự fail-safe, không ném lỗi.
    const { adminRole, entries } =
      await this.ipWhitelistService.getSecurityInfo(id);
    return { ...this.toAdminResponse(account, entries), adminRole };
  }

  /**
   * Sửa một tài khoản admin. Phục vụ cả PATCH /admin/:id (toàn bộ field) lẫn
   * PATCH /admin/:id/ip-whitelist (AddIpWhitelistDto là tập con của
   * UpdateAdminDto nên dùng chung được một đường).
   *
   * Ghi hai bảng nên phải @Transactional: email là nguồn ở accounts (UNIQUE
   * nằm đó) nhưng admin_users giữ một bản sao cho hồ sơ admin — nửa vời sẽ để
   * GET /admin/profile/me trả email cũ mãi mãi.
   */
  @Transactional()
  async updateAdminById(
    id: string,
    dto: UpdateAdminDto,
    caller: { accountId: string; clientIp: string },
  ): Promise<
    AuthenticatedAccount & { ipWhitelist: string | null; adminRole: EAdminRole }
  > {
    let account = await this.requireAdmin(id);
    account = await this.applyAccountFields(account, dto);

    let entries: string[];
    let adminRole: EAdminRole;
    if (dto.ipWhitelist !== undefined) {
      const isSelf = caller.accountId === id;
      const overridden = dto.acknowledgeSelfLockout === true;

      if (isSelf && overridden) {
        // Ghi log vì đây là lối thoát khỏi một bất biến an toàn: cần vết để
        // truy khi sau này có người mất quyền vào mà không rõ vì sao.
        this.logger.warn(
          `Admin ${id} tự đặt whitelist bỏ qua kiểm tra tự khoá từ IP ${caller.clientIp}`,
        );
      }

      const result = await this.ipWhitelistService.setWhitelist(
        id,
        dto.ipWhitelist,
        isSelf && !overridden ? caller.clientIp : undefined,
      );
      entries = result.entries;
      adminRole = result.adminRole;
    } else {
      const info = await this.ipWhitelistService.getSecurityInfo(id);
      entries = info.entries;
      adminRole = info.adminRole;
    }

    return { ...this.toAdminResponse(account, entries), adminRole };
  }

  /**
   * Xoá một IP/CIDR khỏi whitelist. Bất biến chống tự khoá áp cùng luật với
   * updateAdmin: chỉ khi tự sửa của mình, và bỏ qua được bằng cờ có ghi log.
   */
  async removeIpWhitelistEntry(
    id: string,
    entry: string,
    caller: { accountId: string; clientIp: string },
    acknowledgeSelfLockout = false,
  ): Promise<
    AuthenticatedAccount & { ipWhitelist: string | null; adminRole: EAdminRole }
  > {
    const account = await this.requireAdmin(id);

    const isSelf = caller.accountId === id;
    if (isSelf && acknowledgeSelfLockout) {
      this.logger.warn(
        `Admin ${id} xoá '${entry}' khỏi whitelist, bỏ qua kiểm tra tự khoá từ IP ${caller.clientIp}`,
      );
    }

    // removeEntry đã tự trả adminRole từ dòng nó vừa đọc/ghi, không cần đọc
    // admin_users thêm lần nữa.
    const { entries, adminRole } = await this.ipWhitelistService.removeEntry(
      id,
      entry,
      isSelf && !acknowledgeSelfLockout ? caller.clientIp : undefined,
    );

    return { ...this.toAdminResponse(account, entries), adminRole };
  }

  /**
   * Ghi phần thuộc bảng accounts của UpdateAdminDto. Không gửi field nào thì
   * không đụng tới DB — nhánh PATCH /:id/ip-whitelist đi qua đây và phải rẻ.
   *
   * Trả về account đã lưu để chỗ gọi dựng response từ giá trị THẬT trong DB,
   * không phải từ bản trong bộ nhớ.
   */
  private async applyAccountFields(
    account: AuthEntity,
    dto: UpdateAdminDto,
  ): Promise<AuthEntity> {
    // undefined = client không gửi => giữ nguyên. null = chủ động xoá.
    let touched = false;
    if (dto.name !== undefined) {
      account.name = dto.name;
      touched = true;
    }
    if (dto.phone !== undefined) {
      account.phone = dto.phone;
      touched = true;
    }
    if (dto.statusReason !== undefined) {
      account.statusReason = dto.statusReason;
      touched = true;
    }
    if (dto.status !== undefined) {
      account.status = assertNumericEnum(EAccountStatus, dto.status, 'status');
      touched = true;
    }

    const email =
      dto.email === undefined ? undefined : dto.email.trim().toLowerCase();
    if (email !== undefined && email !== account.email) {
      account.email = email;
      touched = true;
    }

    if (!touched) return account;

    let saved: AuthEntity;
    try {
      saved = await this.authRepository.save(account);
      if (email !== undefined) {
        // admin_users giữ bản sao email cho hồ sơ admin; không đồng bộ thì
        // GET /admin/profile/me trả email cũ mãi.
        await this.adminUserRepository.update(
          { accountId: account.id },
          { email },
        );
      }
    } catch (error) {
      // Ràng buộc duy nhất duy nhất chạm được từ đây là accounts.email.
      if (uniqueViolationOf(error) !== null) {
        throw new ConflictException('email already exists');
      }
      throw error;
    }

    // Cache giữ nguyên cả AuthenticatedAccount, nên đổi bất kỳ cột nào cũng
    // phải xoá — không riêng status. Bỏ qua thì ban/đổi email không có hiệu
    // lực cho tới khi cache tự hết hạn.
    await this.accountCache.invalidate(account.id);
    return saved;
  }

  /** Tài khoản phải tồn tại VÀ là admin: chỉ admin mới có dòng admin_users. */
  private async requireAdmin(id: string): Promise<AuthEntity> {
    const account = await this.authRepository.findOneBy({ id });
    if (!account) {
      throw new NotFoundException('account not found');
    }
    if (account.accountRole !== ERole.ADMIN) {
      throw new BadRequestException('account is not an admin');
    }
    return account;
  }

  /** Danh sách rỗng trả về null, đúng ngữ nghĩa "không giới hạn IP". */
  private toAdminResponse(
    account: AuthEntity,
    entries: string[],
  ): AuthenticatedAccount & { ipWhitelist: string | null } {
    const { password: _password, ...result } = account;
    return {
      ...result,
      ipWhitelist: entries.length ? entries.join(',') : null,
    };
  }
}
