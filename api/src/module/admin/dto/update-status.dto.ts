import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';

export class UpdateStatusDto {
  @IsEnum(EAccountStatus, {
    message:
      'status must be 1 (pending), 2 (active), 3 (suspended) or 4 (banned)',
  })
  @ApiProperty({ enum: EAccountStatus, enumName: 'EAccountStatus' })
  status!: EAccountStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiPropertyOptional({
    example: 'Spamming campaigns',
    description: 'Shown to the account owner when they are blocked',
  })
  statusReason?: string | null;
}
