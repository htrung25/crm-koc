import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ECollaborationStatus } from '../../../common/enum/collaboration-status.enum';
import { COLLABORATION_STATUS_MESSAGE } from '../constants/collaboration.constants';

export class UpdateCollaborationStatusDto {
  @IsEnum(ECollaborationStatus, { message: COLLABORATION_STATUS_MESSAGE })
  @ApiProperty({
    enum: ECollaborationStatus,
    enumName: 'ECollaborationStatus',
  })
  status: ECollaborationStatus;
}
