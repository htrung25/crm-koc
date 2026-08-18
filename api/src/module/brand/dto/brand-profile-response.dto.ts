import { ApiProperty } from '@nestjs/swagger';

export class BrandProfileResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Same value as accounts.id' })
  accountId!: string;

  @ApiProperty({ nullable: true, type: String, maxLength: 255 })
  brandName!: string | null;

  @ApiProperty({ nullable: true, type: String, maxLength: 255 })
  companyName!: string | null;

  @ApiProperty({ nullable: true, type: String, maxLength: 14 })
  taxCode!: string | null;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ nullable: true, type: String, maxLength: 20 })
  phone!: string | null;

  @ApiProperty({ nullable: true, type: String })
  website!: string | null;

  @ApiProperty({ nullable: true, type: String, maxLength: 64 })
  industry!: string | null;

  @ApiProperty({ nullable: true, type: String })
  logoUrl!: string | null;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty({ nullable: true, type: String })
  address!: string | null;

  @ApiProperty({ nullable: true, type: String, maxLength: 255 })
  contactName!: string | null;

  @ApiProperty({ nullable: true, type: String, maxLength: 20 })
  contactPhone!: string | null;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh' })
  timezone!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
