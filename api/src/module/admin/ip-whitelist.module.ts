import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from './entities/admin-user.entity';
import { IpWhitelistService } from './ip-whitelist.service';
import { IpWhitelistGuard } from './ip-whitelist.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser])],
  providers: [IpWhitelistService, IpWhitelistGuard],
  exports: [IpWhitelistService, IpWhitelistGuard],
})
export class IpWhitelistModule { }
