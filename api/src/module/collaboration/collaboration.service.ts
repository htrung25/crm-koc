import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { ECollaborationStatus } from '../../common/enum/collaboration-status.enum';
import { Collaboration } from './entities/collaboration.entity';

@Injectable()
export class CollaborationService {
  constructor(
    @InjectRepository(Collaboration)
    private readonly collaborationRepository: Repository<Collaboration>,
  ) {}

  @Transactional()
  async updateStatus(
    id: string,
    next: ECollaborationStatus,
  ): Promise<Collaboration> {
    const collab = await this.collaborationRepository.findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!collab) {
      throw new NotFoundException('collaboration not found');
    }

    collab.status = next;
    if (next === ECollaborationStatus.COMPLETED) {
      collab.completedAt = new Date();
    }

    return this.collaborationRepository.save(collab);
  }
}
