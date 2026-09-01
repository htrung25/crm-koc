import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERole } from '../../common/enum/roles.enum';
import { ESortField } from '../../common/enum/sort-fields.enum';
import { EAccountStatus } from '../../common/enum/account-statuses.enum';
import { ESortOrder } from '../../common/enum/sort-fields.enum';
import {
  PaginatedResult,
  escapeLike,
  paginate,
} from '../../common/util/pagination.util';
import { AccountCacheService } from '../../security/account-cache.service';
import { AuthEntity } from '../auth/entities/auth.entity';
import { AuthenticatedAccount } from '../auth/types/authenticated.types';
import { AdminFilterDto } from './dto/admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { EAdminRole } from './enum/admin-roles.enum';
import { AdminUser } from './entities/admin-user.entity';
import { IpWhitelistService } from './ip-whitelist.service';
import { SessionService } from '../../security/session.service';
import { uniqueViolationOf } from '../../common/util/pg-error.util';
import {
  assertEnum,
  assertNumericEnum,
} from '../../common/util/enum-assert.util';

import {
  EAuditLogCategory,
  ELoginAction,
} from '../../common/enum/audit-log.enum';
import { AuditLogService } from './audit-log.service';

export type AdminListRow = AuthEntity & {
  ipWhitelist: string | null;
  adminRole: EAdminRole;
};

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
    private readonly sessionService: SessionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(query: AdminFilterDto): Promise<PaginatedResult<AdminListRow>> {
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
        ? ESortField.CREATED_AT
        : assertEnum(ESortField, query.sortBy, 'sortBy');
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

  async updateStatus(
    id: string,
    dto: UpdateAdminUserDto,
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
    await this.revokeAccess(id, account.status);

    await this.auditLogService.write({
      category: EAuditLogCategory.AUDIT,
      action: ELoginAction.UPDATE,
      resourceType: 'admin_user',
      resourceId: id,
      metadata: {
        status: account.status,
        statusReason: account.statusReason,
      },
    });

    const { password: _password, ...result } = saved;
    return result;
  }

  /**
   * Cắt quyền truy cập của một account về BANNED.
   */
  private async revokeAccess(
    accountId: string,
    status?: EAccountStatus,
  ): Promise<void> {
    const locked =
      status === undefined ||
      status === EAccountStatus.SUSPENDED ||
      status === EAccountStatus.BANNED;

    if (locked) {
      const revoked = await this.sessionService.deleteAllByAccount(accountId);
      if (revoked) {
        this.logger.warn(`Account ${accountId} bị khoá, huỷ ${revoked} phiên`);
      }
    }
    await this.accountCache.invalidate(accountId);
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

  async updateAdminById(
    id: string,
    dto: UpdateAdminUserDto,
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
        dto.ipWhitelist ?? '',
        isSelf && !overridden ? caller.clientIp : undefined,
      );
      entries = result.entries;
      adminRole = result.adminRole;
    } else {
      const info = await this.ipWhitelistService.getSecurityInfo(id);
      entries = info.entries;
      adminRole = info.adminRole;
    }

    const result = { ...this.toAdminResponse(account, entries), adminRole };
    await this.auditLogService.write({
      category: EAuditLogCategory.AUDIT,
      action: ELoginAction.UPDATE,
      accountId: caller.accountId,
      ipAddress: caller.clientIp,
      resourceType: 'admin_user',
      resourceId: id,
      metadata: { ...dto },
    });
    return result;
  }

  /** Xoá account gốc; FK CASCADE tự xoá dòng tương ứng trong admin_users. */
  async deleteAdminById(
    id: string,
  ): Promise<
    AuthenticatedAccount & { ipWhitelist: string | null; adminRole: EAdminRole }
  > {
    const response = await this.findAdminById(id);
    await this.authRepository.delete(id);
    await this.revokeAccess(id);

    await this.auditLogService.write({
      category: EAuditLogCategory.AUDIT,
      action: ELoginAction.DELETE,
      resourceType: 'admin_user',
      resourceId: id,
      metadata: { email: response.email, name: response.name },
    });

    return response;
  }

  private async applyAccountFields(
    account: AuthEntity,
    dto: UpdateAdminUserDto,
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
    await this.revokeAccess(account.id, account.status);
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
