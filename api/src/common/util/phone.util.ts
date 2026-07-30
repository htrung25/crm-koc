const VN_COUNTRY_CODE = '84';

/**
 * Chuẩn hoá số điện thoại Việt Nam về dạng E.164: +84xxxxxxxxx
 *
 * Chấp nhận: '0900 000 001', '0900-000-001', '84900000001', '+84900000001'
 * Trả về null nếu số không hợp lệ (caller tự quyết định ném lỗi gì).
 *
 * Chỉ hỗ trợ đầu số VN. Nếu sau này cần số quốc tế, thay bằng
 * thư viện libphonenumber-js thay vì mở rộng regex ở đây.
 */
export function normalizePhone(raw: string): string | null {
  // bỏ khoảng trắng và các ký tự phân tách thường gặp
  const cleaned = raw.replace(/[\s.\-()]/g, '');

  // phần thuê bao gồm 9 chữ số, không bắt đầu bằng 0
  const subscriber = /^(?:\+?84|0)([1-9]\d{8})$/.exec(cleaned)?.[1];
  if (!subscriber) {
    return null;
  }

  return `+${VN_COUNTRY_CODE}${subscriber}`;
}
