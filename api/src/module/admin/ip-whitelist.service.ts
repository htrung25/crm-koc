import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Netmask } from 'netmask';
import { BusinessCode } from './../../common/enum/business-code.enum';

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

  private validateEntry(entry: string): void {
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

  private async getUser(adminId: string): Promise<AdminUser> {
    const user = await this.adminUserRepo.findOne({ where: { id: adminId } });
    if (!user) throw new NotFoundException('Admin user not found');
    return user;
  }

  async getByAdminId(adminId: string): Promise<string[]> {
    const user = await this.getUser(adminId);
    return this.parseList(user.ipWhitelist);
  }

  async addEntry(adminId: string, cidr: string): Promise<string[]> {
    this.validateEntry(cidr);

    const user = await this.getUser(adminId);
    const list = this.parseList(user.ipWhitelist);

    if (list.includes(cidr)) {
      if (this.isCidr(cidr)) {
        throw new HttpException(
          {
            message: 'CIDR already exists.',
            businessCode: BusinessCode.CIDR_EXISTS,
          },
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        {
          message: 'IP address already exists.',
          businessCode: BusinessCode.IP_ADDRESS_EXISTS,
        },
        HttpStatus.CONFLICT,
      );
    }

    list.push(cidr);
    user.ipWhitelist = this.serializeList(list);
    await this.adminUserRepo.save(user);
    return list;
  }

  async removeEntry(adminId: string, cidr: string): Promise<string[]> {
    const user = await this.getUser(adminId);
    const list = this.parseList(user.ipWhitelist);

    if (!list.includes(cidr)) {
      throw new NotFoundException('IP/CIDR not found in whitelist');
    }

    const updated = list.filter((e) => e !== cidr);
    user.ipWhitelist = this.serializeList(updated);
    await this.adminUserRepo.save(user);
    return updated;
  }

  async isIpAllowed(adminId: string, sourceIp: string): Promise<boolean> {
    const user = await this.adminUserRepo.findOne({ where: { id: adminId } });
    if (!user) return true;

    const list = this.parseList(user.ipWhitelist);
    if (list.length === 0) return true;

    let normalizedIp = sourceIp;
    if (normalizedIp === '::1') {
      normalizedIp = '127.0.0.1';
    } else if (normalizedIp.startsWith('::ffff:')) {
      normalizedIp = normalizedIp.substring(7);
    }

    return list.some((entry) => {
      try {
        return new Netmask(entry).contains(normalizedIp);
      } catch {
        return false;
      }
    });
  }
}
