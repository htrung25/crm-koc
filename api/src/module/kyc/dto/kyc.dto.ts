import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  EKycDocumentType,
  EKycRejectReason,
  EKycStatus,
} from '../../../common/enum/kyc.enum';
import { ERole } from '../../../common/enum/roles.enum';

/** Trạng thái admin được đặt trực tiếp. LOCKED do hệ thống tự suy, không nhận. */
const REVIEWABLE_STATUSES = [
  EKycStatus.VERIFIED,
  EKycStatus.MORE_INFO,
  EKycStatus.REJECTED,
  EKycStatus.EXPIRED,
] as const;

/** Query của GET /admin/kyc. */
export class KycFilterDto extends PaginationDto {
  @IsOptional()
  // query string luôn là chuỗi: '2' phải thành 2 thì @IsEnum mới pass
  @Type(() => Number)
  @IsEnum(EKycStatus, {
    message:
      'status must be 1 (draft), 2 (pending), 3 (more_info), 4 (verified), 5 (rejected), 6 (locked) or 7 (expired)',
  })
  @ApiPropertyOptional({ enum: EKycStatus, enumName: 'EKycStatus' })
  status?: EKycStatus;

  @IsOptional()
  @IsIn([ERole.BRAND, ERole.CREATOR], {
    message: 'role must be brand or creator',
  })
  @ApiPropertyOptional({ enum: [ERole.BRAND, ERole.CREATOR] })
  role?: ERole.BRAND | ERole.CREATOR;
}

/** Body của POST /kyc/submissions/me/documents. File đi kèm ở phần multipart. */
export class UploadKycDocumentDto {
  @Type(() => Number)
  @IsEnum(EKycDocumentType, {
    message:
      'docType must be 1 (business_license), 2 (tax_certificate), 3 (id_card_front), 4 (id_card_back) or 5 (portrait_with_id)',
  })
  @ApiProperty({ enum: EKycDocumentType, enumName: 'EKycDocumentType' })
  docType: EKycDocumentType;
}

/** Body của PATCH /admin/kyc/:id/status. */
export class ReviewKycDto {
  @Type(() => Number)
  @IsIn(REVIEWABLE_STATUSES as readonly number[], {
    message:
      'status must be 4 (verified), 3 (more_info), 5 (rejected) or 7 (expired)',
  })
  @ApiProperty({ enum: REVIEWABLE_STATUSES })
  status: (typeof REVIEWABLE_STATUSES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsEnum(EKycRejectReason, {
    message:
      'rejectReason must be 1 (blurry_image), 2 (info_mismatch), 3 (expired_document), 4 (suspected_forgery) or 5 (other)',
  })
  @ApiPropertyOptional({
    enum: EKycRejectReason,
    enumName: 'EKycRejectReason',
    description: 'Bắt buộc khi status = rejected',
  })
  rejectReason?: EKycRejectReason;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({
    maxLength: 2000,
    description:
      "Bắt buộc khi rejectReason = 'other', hoặc khi status = more_info",
  })
  reviewNote?: string;
}

/** Một dòng hồ sơ KYC. */
export class KycSubmissionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  accountId: string;

  @ApiProperty({ enum: [ERole.BRAND, ERole.CREATOR] })
  role: ERole.BRAND | ERole.CREATOR;

  @ApiProperty({ enum: EKycStatus, enumName: 'EKycStatus' })
  status: EKycStatus;

  @ApiProperty({ minimum: 1, maximum: 3 })
  attemptNo: number;

  @ApiProperty()
  priority: boolean;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  submittedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  reviewedAt: Date | null;

  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  reviewedBy: string | null;

  @ApiProperty({
    nullable: true,
    enum: EKycRejectReason,
    enumName: 'EKycRejectReason',
  })
  rejectReason: EKycRejectReason | null;

  @ApiProperty({ nullable: true, type: String })
  reviewNote: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

/**
 * Metadata một tài liệu. KHÔNG BAO GIỜ chứa storageKey — lộ khoá là lộ đường
 * tới tài liệu, kể cả khi bucket để private.
 */
export class KycDocumentDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: EKycDocumentType, enumName: 'EKycDocumentType' })
  docType: EKycDocumentType;

  @ApiProperty({ nullable: true, type: String })
  originalName: string | null;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  sizeBytes: number;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  deletedAt: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}
