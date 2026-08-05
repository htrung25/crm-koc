import { NextResponse } from "next/server";

import { normalizeClientIp } from "@/features/admin/ip-whitelist/whitelist";
import { clientIpOf, getClientContext } from "@/lib/api/client-context";

/**
 * IP mà máy chủ thấy ở request hiện tại.
 *
 * Giá trị trả về ĐÃ được chuẩn hoá đúng như `normalizeIp` của backend
 * (`::1` -> `127.0.0.1`, `::ffff:x.x.x.x` -> `x.x.x.x`), nên nó chính là chuỗi
 * mà `IpWhitelistGuard` đem đi so khớp — chép thẳng vào whitelist là dùng được.
 * Trả bản thô sẽ khiến người dùng thêm một mục không bao giờ khớp.
 *
 * Endpoint này KHÔNG phải nguồn sự thật duy nhất: Server Component đọc cùng
 * những header đó và truyền xuống làm giá trị khởi tạo, nên trang vẫn hiển thị
 * đúng khi JavaScript chưa chạy. Đây là đường làm mới phía client.
 *
 * Không có bí mật nào bị lộ: nó chỉ nói cho người gọi biết địa chỉ của chính họ.
 */
export async function GET() {
  const ip = normalizeClientIp(clientIpOf(await getClientContext()));

  return NextResponse.json(
    { ip },
    // Đọc header của từng request nên không được cache ở bất kỳ tầng nào.
    { headers: { "Cache-Control": "no-store" } },
  );
}
