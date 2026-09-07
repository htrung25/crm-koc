import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfiguration } from './entities/system-configuration.entity';
import { SystemConfigurationService } from './system-configuration.service';

/**
 * Hạ tầng dùng chung, KHÔNG phải nghiệp vụ của admin: campaign đọc giá sàn,
 * AdminMaintenanceInterceptor đọc cờ bảo trì.
 *
 * Cố ý không có controller. Mặt tiền sửa cấu hình là việc của admin nên
 * SystemConfigurationController nằm ở AdminModule — nhờ vậy module này không
 * phụ thuộc gì vào admin, và module nào cần đọc cấu hình cũng chỉ kéo đúng
 * chừng này vào.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SystemConfiguration])],
  providers: [SystemConfigurationService],
  exports: [SystemConfigurationService],
})
export class SystemConfigurationModule {}
