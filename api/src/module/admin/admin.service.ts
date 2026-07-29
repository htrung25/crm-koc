import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}
  async createAdmin(adminData: Partial<Admin>): Promise<Admin> {
    if (!adminData.password) {
      throw new BadRequestException('password is required');
    }
    const admin = this.adminRepository.create(adminData);
    admin.created_at = new Date();
    admin.updated_at = new Date();
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    admin.password = hashedPassword;
    return this.adminRepository.save(admin);
  }

  async findByEmail(email: string) {
    const admin = this.adminRepository.findOneBy({ email });
    return admin;
  }

  async validateAdmin(email: string, password: string) {
    const admin = await this.findByEmail(email);
    if (!admin) {
      return null;
    }
    const status = bcrypt.compareSync(password, admin.password);
    if (status) {
      return admin;
    }
    return null;
  }
}
