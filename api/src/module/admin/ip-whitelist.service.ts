import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Netmask } from 'netmask';
import { BusinessCode } from './../../common/enum/business-code.enum';
import { AdminUser } from './entities/admin_user.entity';
import { EAdminRole } from './enum/admin-roles.enum';

@Injectable()
export class IpWhitelistService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepo: Repository<AdminUser>,
  ) {}

  private parseList(raw: string | null): string[] {
    if (!raw) return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private serializeList(list: string[]): string | null {
    return list.length ? list.join(',') : null;
  }

  private isCidr(value: string): boolean {
    return value.includes('/');
  }

  private assertShape(entry: string): void {
    const match = entry.match(
      /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/,
    );

    const shapeOk =
      match !== null &&
      match.slice(1, 5).every((octet) => Number(octet) <= 255) &&
      (match[5] === undefined || Number(match[5]) <= 32);

    if (!shapeOk) {
      const isCidr = this.isCidr(entry);
      throw new HttpException(
        {
          // Kèm entry vào message: BE dừng ở lỗi ĐẦU TIÊN nên client cần biết
          // phần tử nào hỏng, không thì phải tự đoán trong cả chuỗi CSV.
          message: isCidr
            ? `Invalid CIDR format: ${entry}`
            : `Invalid IP address format: ${entry}`,
          businessCode: isCidr
            ? BusinessCode.INVALID_CIDR_FORMAT
            : BusinessCode.INVALID_IP_FORMAT,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateEntry(entry: string): void {
    this.assertShape(entry);

    try {
      new Netmask(entry);
    } catch {
      if (this.isCidr(entry)) {
        throw new HttpException(
          {
            message: 'Invalid CIDR format.',
            businessCode: BusinessCode.INVALID_CIDR_FORMAT,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        {
          message: 'Invalid IP address format.',
          businessCode: BusinessCode.INVALID_IP_FORMAT,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** IPv6 loopback và dạng IPv4-mapped đều quy về IPv4 để so với CIDR. */
  private normalizeIp(sourceIp: string): string {
    if (sourceIp === '::1') return '127.0.0.1';
    if (sourceIp.startsWith('::ffff:')) return sourceIp.substring(7);
    return sourceIp;
  }

  private listAllows(list: string[], sourceIp: string): boolean {
    if (list.length === 0) return true;

    const normalized = this.normalizeIp(sourceIp);
    return list.some((entry) => {
      try {
        return new Netmask(entry).contains(normalized);
      } catch {
        return false;
      }
    });
  }

  private assertReachable(list: string[], clientIp: string): void {
    if (this.listAllows(list, clientIp)) return;
    const normalized = this.normalizeIp(clientIp);

    throw new HttpException(
      {
        message: `This change would lock you out: your current IP ${normalized} is not covered by the new whitelist.`,
        businessCode: BusinessCode.IP_WHITELIST_WOULD_LOCK_YOU_OUT,
        clientIp: normalized,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  private async getUser(adminId: string): Promise<AdminUser> {
    const user = await this.adminUserRepo.findOne({
      where: { accountId: adminId },
    });
    if (!user) throw new NotFoundException('Admin user not found');
    return user;
  }

  async getSecurityInfo(
    adminId: string,
  ): Promise<{ adminRole: EAdminRole; entries: string[] }> {
    const user = await this.adminUserRepo.findOne({
      where: { accountId: adminId },
      select: { accountId: true, adminRole: true, ipWhitelist: true },
    });
    if (!user) return { adminRole: EAdminRole.ADMIN, entries: [] };
    return {
      adminRole: user.adminRole,
      entries: this.parseList(user.ipWhitelist),
    };
  }

  async getManyByAdminIds(
    adminIds: string[],
  ): Promise<
    Map<string, { ipWhitelist: string | null; adminRole: EAdminRole }>
  > {
    if (adminIds.length === 0) return new Map();

    const rows = await this.adminUserRepo.find({
      where: { accountId: In(adminIds) },
      select: { accountId: true, ipWhitelist: true, adminRole: true },
    });

    return new Map(
      rows.map((row) => [
        row.accountId,
        { ipWhitelist: row.ipWhitelist, adminRole: row.adminRole },
      ]),
    );
  }

  private normalizeEntry(entry: string): string {
    if (!this.isCidr(entry)) return entry;

    const block = new Netmask(entry);
    return `${block.base}/${block.bitmask}`;
  }

  async setWhitelist(
    adminId: string,
    raw: string,
    reachableFrom?: string,
  ): Promise<{ adminRole: EAdminRole; entries: string[] }> {
    const user = await this.getUser(adminId);

    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const entry of this.parseList(raw)) {
      this.validateEntry(entry);

      // Dedupe SAU khi chuẩn hoá: '10.0.0.5/24' và '10.0.0.7/24' là cùng một
      // dải, để cả hai vào danh sách là thừa và gây hiểu nhầm.
      const value = this.normalizeEntry(entry);
      if (seen.has(value)) continue;

      seen.add(value);
      normalized.push(value);
    }

    if (reachableFrom !== undefined) {
      this.assertReachable(normalized, reachableFrom);
    }

    user.ipWhitelist = this.serializeList(normalized);
    await this.adminUserRepo.save(user);
    // user đã được đọc bởi getUser() ở trên nên adminRole có sẵn, không cần
    // đọc thêm lần nữa.
    return { adminRole: user.adminRole, entries: normalized };
  }

  async removeEntry(
    adminId: string,
    entry: string,
    reachableFrom?: string,
  ): Promise<{ adminRole: EAdminRole; entries: string[] }> {
    this.validateEntry(entry);

    const user = await this.getUser(adminId);
    const list = this.parseList(user.ipWhitelist);
    const target = this.normalizeEntry(entry);

    const updated = list.filter((item) => this.normalizeEntry(item) !== target);

    if (updated.length === list.length) {
      throw new NotFoundException(`IP/CIDR not in whitelist: ${entry}`);
    }

    // Xoá tới rỗng là hợp lệ: rỗng nghĩa là bỏ giới hạn, không phải khoá cửa.
    // Nhưng xoá phần tử ĐANG cho mình đi qua thì vẫn là tự khoá.
    if (reachableFrom !== undefined) {
      this.assertReachable(updated, reachableFrom);
    }

    user.ipWhitelist = this.serializeList(updated);
    await this.adminUserRepo.save(user);
    // user đã được đọc bởi getUser() ở trên nên adminRole có sẵn, không cần
    // đọc thêm lần nữa.
    return { adminRole: user.adminRole, entries: updated };
  }

  async isIpAllowed(adminId: string, sourceIp: string): Promise<boolean> {
    const user = await this.adminUserRepo.findOne({
      where: { accountId: adminId },
    });
    // Không có dòng admin_users nghĩa là chưa cấu hình gì => không giới hạn.
    if (!user) return true;

    return this.listAllows(this.parseList(user.ipWhitelist), sourceIp);
  }
}
