import { ApiProperty } from '@nestjs/swagger';
import { ECollaborationStatus } from '../../../common/enum/collaboration-status.enum';

/** Một dòng hợp tác trong danh sách. */
export class CollaborationDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  brandId: string;

  @ApiProperty({ format: 'uuid' })
  creatorId: string;

  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  campaignId: string | null;

  @ApiProperty({
    enum: ECollaborationStatus,
    enumName: 'ECollaborationStatus',
  })
  status: ECollaborationStatus;

  /** numeric của Postgres về driver pg dưới dạng chuỗi, giữ nguyên để khỏi mất số lẻ. */
  @ApiProperty({ nullable: true, type: String, example: '1500000.00' })
  agreedPrice: string | null;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  startedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  submittedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  completedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  cancelledAt: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}
