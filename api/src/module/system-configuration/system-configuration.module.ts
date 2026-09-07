import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfiguration } from './entities/system-configuration.entity';
import { SystemConfigurationService } from './system-configuration.service';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfiguration])],
  providers: [SystemConfigurationService],
  exports: [SystemConfigurationService],
})
export class SystemConfigurationModule {}
