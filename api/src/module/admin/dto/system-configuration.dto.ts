import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ESystemConfig } from '../constants/system-config.enum';

/**
 * Một cấu hình cần sửa. KHÔNG có `type` và `group`: đổi kiểu của một cấu hình
 * đang chạy là việc của migration, không phải của một request PATCH.
 */
export class UpdateSystemConfigurationItemDto {
  @IsString()
  @MaxLength(128)
  @ApiProperty({ example: 'ENV_SYSTEM_ACTIVE', maxLength: 128 })
  key: string;

  // Luôn là chuỗi, kể cả với số và boolean: cột value là text, và service đối
  // chiếu chuỗi này với `type` đã lưu để biết nó hợp lệ hay không.
  @IsString()
  @ApiProperty({ example: 'false', description: 'Luôn gửi dạng chuỗi' })
  value: string;
}

export class UpdateSystemConfigurationsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => UpdateSystemConfigurationItemDto)
  @ApiProperty({ type: [UpdateSystemConfigurationItemDto] })
  items: UpdateSystemConfigurationItemDto[];
}

/** Một dòng cấu hình trả về cho màn quản trị. */
export class SystemConfigurationDto {
  @ApiProperty({ maxLength: 128 })
  key: string;

  @ApiProperty({ description: 'Luôn là chuỗi; đọc theo type' })
  value: string;

  @ApiProperty({ enum: ESystemConfig, enumName: 'ESystemConfig' })
  type: ESystemConfig;

  @ApiProperty({ maxLength: 64, example: 'environment' })
  group: string;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  updatedBy: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}
