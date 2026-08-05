import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Body của PATCH /admin/:id — chỉ phục vụ việc đặt lại IP whitelist.
 *
 * NGỮ NGHĨA LÀ GHI ĐÈ, KHÔNG PHẢI THÊM VÀO. `ipWhitelist` thay thế toàn bộ
 * chuỗi CSV đang lưu:
 *   - không gửi field  -> giữ nguyên danh sách cũ
 *   - gửi ""           -> lưu null, tức CHO PHÉP MỌI IP (không phải chặn hết)
 *   - gửi "a,b"        -> danh sách còn đúng a và b, mọi mục khác biến mất
 * Muốn xoá đúng một phần tử thì dùng DELETE /admin/:id/ip-whitelist, vì nó
 * đọc-sửa-ghi trên giá trị mới nhất nên không đè mất thay đổi của người khác.
 *
 * Tách khỏi `UpdateAdminDto` có lý do kỹ thuật, không chỉ vì gọn: ValidationPipe
 * chạy với `whitelist` + `forbidNonWhitelisted` (main.ts). Một class field khai
 * trong DTO vẫn TỒN TẠI trên instance với giá trị `undefined` sau
 * `plainToInstance`, kể cả khi client không gửi nó. Field nào không có decorator
 * validator sẽ bị coi là property lạ và làm MỌI request bị từ chối 400
 * "property X should not exist" — dù body hoàn toàn hợp lệ. Vì vậy DTO này chỉ
 * được chứa đúng field nó thật sự nhận, và mọi field thêm vào sau này BẮT BUỘC
 * phải có decorator validator.
 */
export class AddIpWhitelistDto {
  @IsOptional()
  @IsString()
  // Cột là text không giới hạn; chặn ở đây để một chuỗi khổng lồ không thành
  // hàng nghìn lần dựng Netmask trên mỗi request đi qua guard.
  @MaxLength(2000)
  @ApiPropertyOptional({
    example: '203.0.113.1,10.0.0.0/24',
    maxLength: 2000,
    description:
      'CSV các IP/CIDR. Ghi đè toàn bộ. Chuỗi rỗng = cho phép mọi IP.',
  })
  ipWhitelist?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    example: false,
    default: false,
    description:
      'Bỏ qua kiểm tra tự khoá khi tự sửa whitelist của mình. Dùng có ý thức.',
  })
  acknowledgeSelfLockout?: boolean;
}
