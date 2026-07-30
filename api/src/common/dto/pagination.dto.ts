import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
/** Trần cứng để client không kéo nguyên bảng bằng ?limit=1000000 */
export const MAX_LIMIT = 100;

/**
 * DTO phân trang dùng chung cho mọi endpoint dạng danh sách.
 * Kế thừa nó rồi thêm field lọc riêng của từng module.
 *
 * @Type(() => Number) là bắt buộc: query param luôn là string, không ép kiểu
 * thì '2' lọt vào phép tính và @IsInt cũng không bao giờ pass.
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ minimum: 1, default: DEFAULT_PAGE, example: 1 })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_LIMIT,
    default: DEFAULT_LIMIT,
    example: 20,
  })
  limit?: number;
}
