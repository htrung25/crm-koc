import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from './entities/collaboration.entity';
import { CollaborationService } from './collaboration.service';

@Module({
  imports: [TypeOrmModule.forFeature([Collaboration])],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
