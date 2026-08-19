import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ECollaborationStatus } from '../../common/enum/collaboration-status.enum';
import { ESortField, ESortOrder } from '../../common/enum/sort-fields.enum';
import { assertEnum } from '../../common/util/enum-assert.util';
import { PaginatedResult, paginate } from '../../common/util/pagination.util';
import {
  COLLABORATION_SORT_FIELDS,
  CollaborationFilterDto,
} from './dto/collaboration.dto';
import { Collaboration } from './entities/collaboration.entity';

const COLLABORATION_LIST_FIELDS = [
  'id',
  'brandId',
  'creatorId',
  'campaignId',
  'status',
  'agreedPrice',
  'startedAt',
  'completedAt',
  'cancelledAt',
  'createdAt',
  'updatedAt',
] as const;

/** Kiểu của một dòng trong danh sách: đúng bằng các cột đã select. */
export type CollaborationListItem = Pick<
  Collaboration,
  (typeof COLLABORATION_LIST_FIELDS)[number]
>;

/** sortBy đi thẳng vào SQL nên phải khớp danh sách cột cho phép. */
function assertSortField(
  value: string,
): (typeof COLLABORATION_SORT_FIELDS)[number] {
  const allowed = COLLABORATION_SORT_FIELDS as readonly string[];
  if (!allowed.includes(value)) {
    throw new BadRequestException(
      `sortBy must be one of: ${allowed.join(', ')}`,
    );
  }
  return value as (typeof COLLABORATION_SORT_FIELDS)[number];
}

@Injectable()
export class CollaborationService {
  constructor(
    @InjectRepository(Collaboration)
    private readonly collaborationRepository: Repository<Collaboration>,
  ) {}

  async findAll(
    brandId: string,
    query: CollaborationFilterDto,
  ): Promise<PaginatedResult<CollaborationListItem>> {
    const qb = this.collaborationRepository
      .createQueryBuilder('collaboration')
      .select(COLLABORATION_LIST_FIELDS.map((f) => `collaboration.${f}`))
      .where('collaboration.brandId = :brandId', { brandId });

    if (query.status !== undefined) {
      qb.andWhere('collaboration.status = :status', {
        status: assertEnum(ECollaborationStatus, query.status, 'status'),
      });
    }

    if (query.creatorId) {
      qb.andWhere('collaboration.creatorId = :creatorId', {
        creatorId: query.creatorId,
      });
    }

    if (query.campaignId) {
      qb.andWhere('collaboration.campaignId = :campaignId', {
        campaignId: query.campaignId,
      });
    }

    if (query.createdFrom) {
      qb.andWhere('collaboration.createdAt >= :from', {
        from: query.createdFrom,
      });
    }
    if (query.createdTo) {
      const to = new Date(query.createdTo);
      to.setDate(to.getDate() + 1);
      qb.andWhere('collaboration.createdAt < :to', { to });
    }

    // So sánh ở SQL để numeric không phải đi vòng qua float của JS.
    if (query.minPrice !== undefined) {
      qb.andWhere('collaboration.agreedPrice >= :minPrice', {
        minPrice: query.minPrice,
      });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('collaboration.agreedPrice <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    // orderBy ghép chuỗi raw vào SQL => bắt buộc whitelist, không tin input
    const sortBy =
      query.sortBy === undefined
        ? ESortField.CREATED_AT
        : assertSortField(query.sortBy);
    const sortOrder =
      query.sortOrder === undefined
        ? ESortOrder.DESC
        : assertEnum(ESortOrder, query.sortOrder, 'sortOrder');

    qb.orderBy(`collaboration.${sortBy}`, sortOrder);
    // khoá thứ tự bằng id để phân trang ổn định khi trùng giá trị sort
    qb.addOrderBy('collaboration.id', ESortOrder.ASC);

    return paginate(qb, query);
  }

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
