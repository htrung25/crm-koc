import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';

// Body của PATCH /admin/:id. Tách khỏi AdminResponseDto vì hai chiều khác tập
// field: id/accountRole/createdAt/updatedAt chỉ đọc, còn adminRole cố tình
// vắng mặt để phong super admin không đi qua đường này.
//
// Mọi field BẮT BUỘC có validator: ValidationPipe chạy với forbidNonWhitelisted
// nên field thiếu decorator sẽ làm mọi request 400 "property should not exist".
export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'John Doe', maxLength: 255 })
  name?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ example: 'admin@gmail.com', format: 'email' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiPropertyOptional({ nullable: true, type: String, maxLength: 20 })
  phone?: string | null;

  @IsOptional()
  @IsEnum(EAccountStatus, {
    message:
      'status must be 1 (pending), 2 (active), 3 (suspended) or 4 (banned)',
  })
  @ApiPropertyOptional({ enum: EAccountStatus, enumName: 'EAccountStatus' })
  status?: EAccountStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiPropertyOptional({
    example: 'Spamming campaigns',
    description: 'Shown to the account owner when they are blocked',
  })
  statusReason?: string | null;

  // Ghi đè toàn bộ, không phải thêm vào. Chuỗi rỗng = cho phép mọi IP.
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({
    example: '203.0.113.1,10.0.0.0/24',
    maxLength: 2000,
    description: 'CSV các IP/CIDR. Ghi đè toàn bộ. Rỗng = cho phép mọi IP.',
  })
  ipWhitelist?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    default: false,
    description: 'Bỏ qua kiểm tra tự khoá khi tự sửa whitelist của mình.',
  })
  acknowledgeSelfLockout?: boolean;
}
