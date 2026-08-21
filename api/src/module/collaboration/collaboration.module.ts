import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityModule } from '../../security/security.module';
import { AuthEntity } from '../auth/entities/auth.entity';
import { BrandModule } from '../brand/brand.module';
import { CreatorModule } from '../creator/creator.module';
import { Collaboration } from './entities/collaboration.entity';
import { CollaborationService } from './collaboration.service';
import { BrandCollaborationController } from './brand-collaboration.controller';
import { CreatorCollaborationController } from './creator-collaboration.controller';

/**
 * Hợp tác là việc của cả ba vai trò nên đứng riêng, không nằm trong BrandModule.
 * Nhờ vậy controller phía creator không phải mượn chỗ của brand, và BrandModule
 * hết phải import CreatorModule.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Collaboration, AuthEntity]),
    SecurityModule,
    // Lấy BrandProfileService và CreatorProfileService để kiểm hồ sơ hai bên.
    BrandModule,
    CreatorModule,
  ],
  controllers: [BrandCollaborationController, CreatorCollaborationController],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
