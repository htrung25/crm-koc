import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ECollaborationStatus } from '../../common/enum/collaboration-status.enum';
import { Collaboration } from './entities/collaboration.entity';

@Injectable()
export class CollaborationService {
  constructor(
    @InjectRepository(Collaboration)
    private readonly collaborationRepository: Repository<Collaboration>,
  ) {}

  // async getCollaboration(id: string)

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

  async countSuccessfulCreators(brandId: string): Promise<number> {
    const result = await this.collaborationRepository
      .createQueryBuilder('collaboration')
      .select(
        'COUNT(DISTINCT collaboration.creatorId)',
        'successfulCreatorCount',
      )
      .where('collaboration.brandId = :brandId', { brandId })
      .andWhere('collaboration.status = :status', {
        status: ECollaborationStatus.COMPLETED,
      })
      .getRawOne<{ successfulCreatorCount: string }>();

    // COUNT trả bigint nên driver pg cho ra chuỗi; không ép kiểu thì "2" lọt ra API.
    return Number(result?.successfulCreatorCount ?? 0);
  }

  /** Số LƯỢT hoàn thành. Khác countSuccessfulCreators: cùng creator tính nhiều lần. */
  async countSuccessfulByBrand(brandId: string): Promise<number> {
    return this.collaborationRepository.count({
      where: {
        brandId,
        status: ECollaborationStatus.COMPLETED,
      },
    });
  }
}
