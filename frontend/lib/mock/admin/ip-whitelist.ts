/**
 * Danh sách IP được phép đăng nhập cổng quản trị.
 *
 * Backend đã có `IpWhitelistService` (getByAdminId / addEntry / removeEntry)
 * nhưng CHƯA controller nào expose ra HTTP, nên đây tạm là nguồn mock. Khi
 * backend mở endpoint, chỉ cần thay hằng này bằng lời gọi API trả về đúng
 * `IpWhitelistEntry[]` — component không phải sửa.
 *
 * Quy ước lưu ở backend: một chuỗi phân tách bằng dấu phẩy, mỗi phần tử là IP
 * đơn hoặc dải CIDR, kiểm tra bằng thư viện `netmask`.
 */

export type IpWhitelistEntry = {
  /** IP đơn ("203.0.113.9") hoặc dải CIDR ("203.0.113.0/24"). */
  value: string;
  /** Ghi chú do người thêm đặt, giúp biết dải này là của ai. */
  note: string;
  addedAt: string;
};

export const IP_WHITELIST: IpWhitelistEntry[] = [
  {
    value: "127.0.0.1",
    note: "Máy phát triển cục bộ",
    addedAt: "01/08/2026",
  },
  {
    value: "203.0.113.0/24",
    note: "Dải văn phòng Hà Nội",
    addedAt: "28/07/2026",
  },
  {
    value: "198.51.100.42",
    note: "VPN đội vận hành",
    addedAt: "25/07/2026",
  },
];
