# UI cấu hình IP Whitelist cho Admin Panel

Ngày: 2026-08-05
Phạm vi: `frontend/` (Next.js 16 App Router, BFF trước NestJS)

## 1. Mục tiêu

Hiển thị danh sách IP/CIDR được phép truy cập cổng quản trị tại `/admin/security`, dùng dữ liệu thật thay cho mock hiện tại.

**Phân quyền** (khớp guard của backend, cập nhật 2026-08-05):

| `admin_users.admin_role` | Quyền |
|---|---|
| `super_admin` | xem **và** chỉnh sửa |
| `admin` | **chỉ xem** |

**Ngoài phạm vi:** quản lý whitelist của admin khác (cần `GET /admin/admin-list` + bảng phân trang — tách spec riêng), lọc/tìm theo IP (backend không hỗ trợ).

## 2. Hiện trạng

`/admin/security` đã tồn tại và render `IpWhitelistManager` từ `lib/mock/admin/ip-whitelist.ts`. State chỉ sống trong phiên, không có request nào rời trình duyệt. Component chứa sẵn logic thuần đã đúng (`validateEntry`, `toUint32`, `entryCovers`) — phần này được giữ lại, chỉ tách file.

## 3. Ràng buộc từ backend

Whitelist **không phải resource riêng**: nó là cột text `admin_users.ip_whitelist` lưu CSV (`"203.0.113.1,10.0.0.0/24"`), per-admin.

| Điều | Hệ quả cho UI |
|---|---|
| `null` / rỗng = **cho phép mọi IP** | phải hiện badge "Không giới hạn IP"; nút xoá toàn bộ phải nói rõ hậu quả là **mở**, không phải chặn |
| `PATCH` ghi đè toàn bộ chuỗi | không có "append"; thêm một mục vẫn phải gửi cả danh sách |
| Backend chuẩn hoá + khử trùng lặp | `10.0.0.5/24` lưu thành `10.0.0.0/24`; giá trị hiển thị sau khi lưu **khác** thứ vừa gõ, và đó là đúng |
| Chỉ IPv4 | guard chỉ quy đổi được `::1` và `::ffff:x.x.x.x`; entry IPv6 thuần không bao giờ khớp → chặn từ client |
| Không có optimistic locking | luôn set lại state từ `ipWhitelist` trong response, không tin chuỗi vừa gửi |
| Giới hạn 2000 ký tự | validate độ dài CSV trước khi gửi |

Response không có envelope — trả thẳng DTO. Lỗi có **hai** hình dạng: lỗi nghiệp vụ (`{ message, businessCode }`) và lỗi Nest mặc định (`{ message, error, statusCode }`, `message` là **mảng** khi `ValidationPipe` từ chối). Phân biệt thành/bại bằng HTTP status, phân biệt loại lỗi bằng `businessCode`.

## 4. Quyết định thiết kế

### 4.1. Id lấy từ `GET /me`, không từ cookie

Cookie phiên chỉ có `token` / `refresh_token` / `user_role` — **không có account id**. Whitelist lại gắn theo `/admin/:id`. Nên mọi đường chạm tới whitelist đều phải resolve id qua `GET /me` (trả `AuthenticatedAccount`, có `id`) trước.

### 4.2. Route Handler không nhận `id` từ client

```
app/api/admin/me/ip-whitelist/route.ts    PATCH (ghi đè) + DELETE (xoá 1 mục)
```

Không dùng `app/api/admin/[id]/route.ts`. Lý do: bất biến chống tự khoá của backend **chỉ áp khi `:id` là chính người gọi**. Nếu browser truyền được `id`, nó gửi được id của admin khác — request vẫn hợp lệ (vẫn đúng role admin) nhưng lá chắn tắt lặng lẽ. Resolve id phía server thì id không bao giờ đi qua trình duyệt, lá chắn luôn bật.

Đọc lần đầu **không** qua Route Handler: Server Component gọi `apiRequest` trực tiếp (đọc được cookie). Route Handler chỉ phục vụ mutation do browser khởi xướng.

### 4.3. `ApiError` phải mang theo body lỗi

`lib/api/client.ts` hiện chỉ giữ `message` + `status`. Toàn bộ luồng 422 phụ thuộc `body.clientIp`, và highlight chip sai phụ thuộc `businessCode` — cả hai bị vứt trước khi tới nơi cần. Thêm (additive, không đụng call site cũ):

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown = null,
  ) { … }
  get businessCode(): string | undefined
  get clientIp(): string | undefined
}
```

### 4.4. Bỏ "Ghi chú" và "Ngày thêm"

Backend không có chỗ lưu hai trường này. Giữ chúng ở localStorage sẽ mồ côi ngay khi backend chuẩn hoá `10.0.0.5/24` → `10.0.0.0/24`. Bảng đổi thành **chip-list** phản ánh đúng thứ DB lưu. Bù lại mỗi chip hiện số host — `10.0.0.0/24 · 256 IP` — thông tin có thật và hữu ích hơn.

### 4.5. Lưu ngay từng thao tác, không có nút "Lưu"

| Thao tác | Request |
|---|---|
| Thêm chip | `PATCH` với CSV đầy đủ |
| Bấm X trên chip | `DELETE ?entry=…` (nhớ `encodeURIComponent`) |
| Xoá toàn bộ | `PATCH` với `ipWhitelist: ""` |

Không có trạng thái "chưa lưu" để mất khi đóng tab. Chuẩn hoá của backend hiện ra ngay lúc người dùng vừa gõ, không dồn vào một lần lưu hàng loạt. Dialog 422 gắn đúng vào thao tác vừa gây ra nó.

Dùng `DELETE` cho từng chip thay vì `PATCH` cả chuỗi: server đọc-sửa-ghi trên giá trị mới nhất nên không đụng mục mà tab khác vừa thêm.

### 4.6. Phân quyền super admin — và một phụ thuộc backend chưa có

Backend đã gác sẵn: `PATCH /admin/:id` và `DELETE /admin/:id/ip-whitelist` đều là `@UseGuards(IpWhitelistGuard, SuperAdminGuard)`, trả `403 REQUIRES_SUPER_ADMIN`. `GET /admin/:id` **không** bị gác — admin thường vẫn đọc được. FE không cần lặp lại việc chặn; nó chỉ quyết định hiện gì.

> **⚠ BLOCKER — cần backend bổ sung trước khi làm FE.**
> `adminRole` nằm trên entity `admin_users` nhưng **không DTO nào expose**: `GET /me` trả `accounts` row, `AdminResponseDto` và `AdminProfileResponseDto` đều không có. Nghĩa là FE không có cách nào biết nên render chế độ sửa hay chỉ-đọc — chỉ phát hiện được bằng cách gửi một request ghi rồi ăn 403.
>
> Đề xuất: thêm `adminRole` vào **`AdminResponseDto`**. `findAdminById` vốn đã gọi `ipWhitelistService.getByAdminId(id)` — cùng bảng `admin_users` — nên lấy thêm một cột là thay đổi nhỏ, và nó phục vụ được cả `GET /admin/:id` lẫn `admin-list` sau này.
>
> Chừng nào chưa có: **fallback fail-safe** là render chỉ-đọc. Thà một super admin phải hỏi vì sao không sửa được, còn hơn một admin thường bấm nút rồi ăn 403 khó hiểu.

**Chế độ chỉ-đọc** không phải là ẩn nút. Nó phải nói rõ *vì sao*: chip không có nút X, không có ô nhập, kèm dòng "Chỉ super admin mới thay đổi được danh sách này." Ẩn trơn khiến người dùng tưởng tính năng hỏng.

**Lỗ hổng còn lại, cần bạn quyết sau:** với phân quyền này, whitelist của một admin thường **không ai sửa được qua UI** — chính họ không có quyền, còn super admin thì chưa có màn hình chọn admin khác. Hiện chỉ đổi được dưới DB. Giải bằng spec "danh sách admin" (§1 Ngoài phạm vi).

## 5. Kiến trúc

```
app/admin/(dashboard)/security/page.tsx     Server Component
  ├─ getClientContext()          → clientIp hiển thị
  ├─ GET /me                     → adminId
  └─ GET /admin/:adminId         → ipWhitelist + adminRole (chờ BE, §4.6)
       └─ <IpWhitelistManager currentIp defaultWhitelist canEdit />   "use client"
            └─ useIpWhitelist()  → PATCH/DELETE qua /api/admin/me/ip-whitelist
                 └─ <SelfLockoutDialog />  khi 422
```

**⚠ Bắt buộc:** mọi lời gọi `apiRequest` chạm tới whitelist phải truyền `clientContext` từ `getClientContext()`. Quên thì backend thấy IP của server Next: bất biến chống tự khoá vẫn chạy nhưng so sai IP — admin lưu một danh sách không chứa IP thật của mình vẫn nhận 200, rồi mất quyền vào ở request kế tiếp. Lá chắn trông như đang hoạt động trong khi đã vô hiệu.

### File

| File | Việc |
|---|---|
| `lib/api/client.ts` | thêm `body` vào `ApiError` (§4.3) |
| `features/admin/ip-whitelist/types.ts` | `AdminResponse`, `WhitelistErrorBody` |
| `features/admin/ip-whitelist/whitelist.ts` | thuần: `parseWhitelist`, `serializeWhitelist`, `validateEntry`, `hostCount`, `entryCovers`, `normalizeCidr` (tính network address để cảnh báo host bits, §6) |
| `features/admin/ip-whitelist/use-ip-whitelist.ts` | state chip-list, submit, xử lý 422 |
| `components/admin/ip-whitelist-manager.tsx` | viết lại: chip-list, bỏ note/addedAt, badge "Không giới hạn IP", chế độ chỉ-đọc (§4.6) |
| `components/admin/self-lockout-dialog.tsx` | mới |
| `app/api/admin/me/ip-whitelist/route.ts` | mới: PATCH + DELETE |
| `app/admin/(dashboard)/security/page.tsx` | dữ liệu thật |
| `lib/mock/admin/ip-whitelist.ts` | xoá |

`entryCovers` / `toUint32` chuyển nguyên từ component sang `whitelist.ts` (logic đã đúng), dùng cho badge "IP của bạn đang được cho phép".

## 6. Validate phía client

Chỉ để báo lỗi sớm khi gõ, **không phải để bảo vệ** — backend validate lại và chặt hơn `netmask`.

- Luật: `^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$`, mỗi octet ≤ 255, prefix ≤ 32
- Chặn: thiếu octet (`10`, `192.168.1`), octet > 255, prefix > 32, IPv6
- **Cảnh báo, không chặn** khi CIDR có host bits ≠ 0: *"10.0.0.5/24 sẽ được lưu thành 10.0.0.0/24, tức toàn bộ 256 địa chỉ"*
- Chặn trước khi gửi nếu CSV vượt 2000 ký tự

## 7. Xử lý lỗi

| HTTP | businessCode | Thông báo |
|---|---|---|
| 400 | `INVALID_IP_FORMAT` | "Địa chỉ IP không hợp lệ: {entry}" |
| 400 | `INVALID_CIDR_FORMAT` | "Dải CIDR không hợp lệ: {entry}" |
| 400 | — | "Tài khoản này không phải quản trị viên" |
| 401 | — | `apiFetch` tự refresh 1 lần; vẫn 401 → điều hướng `/admin` |
| 403 | — (`message: "REQUIRES_SUPER_ADMIN"`) | "Chỉ super admin mới thay đổi được danh sách này" → chuyển UI sang chỉ-đọc |
| 403 | — (khác) | "Bạn đang truy cập từ IP không nằm trong danh sách cho phép" |
| 404 | — | "Không tìm thấy {entry} trong danh sách" |
| 422 | `IP_WHITELIST_WOULD_LOCK_YOU_OUT` | mở `SelfLockoutDialog` (§8) |

Message của lỗi định dạng có kèm entry (`Invalid CIDR format: 1.2.3.4/33`) vì backend dừng ở phần tử sai đầu tiên — dùng nó để highlight đúng chip.

`CIDR_EXISTS` / `IP_ADDRESS_EXISTS` có trong enum nhưng **không endpoint nào trả về** (mô hình ghi đè thì trùng lặp bị gộp im lặng). Không thiết kế UI dựa vào chúng.

## 8. Dialog chống tự khoá

Nhận 422 kèm `clientIp` (đã chuẩn hoá — `127.0.0.1` chứ không phải `::ffff:127.0.0.1`, nên chép thẳng vào whitelist là khớp).

- **Nút chính, an toàn:** "Thêm IP hiện tại `{clientIp}` vào danh sách" → gửi lại kèm IP đó
- **Nút phụ:** `acknowledgeSelfLockout: true`, **disabled** cho tới khi tick *"Tôi hiểu mình có thể mất quyền truy cập"*. Không bao giờ tick sẵn. Mỗi lần dùng backend ghi log cảnh báo.
- Dialog phải nói thẳng: **không có đường tự cứu.** Đăng nhập lại vô ích. Phải nhờ một admin khác gọi `PATCH /admin/:id` sửa hộ (nhánh này không bị áp bất biến), hoặc sửa thẳng dưới DB.

Lối thoát này tồn tại cho trường hợp hợp lệ: admin sắp đổi mạng, sắp bật VPN.

## 9. Ba điều UI phải nói rõ

1. Danh sách rỗng = **cho phép mọi IP** → badge "Không giới hạn IP" khi `ipWhitelist == null`
2. Thêm một chip vẫn gửi lại **toàn bộ** danh sách (backend chỉ có ghi đè, không có append) — nên nếu một tab khác vừa sửa, thay đổi đó có thể bị đè. Đây là lý do luôn refetch trước khi mở trang.
3. Backend sẽ chuẩn hoá — giá trị sau khi lưu có thể khác giá trị vừa gõ, và điều đó là đúng

## 10. Kiểm chứng

- **Vitest** cho `whitelist.ts`: `parseWhitelist`/`serializeWhitelist` khứ hồi, mảng rỗng → `""`; `validateEntry` với thiếu octet, octet > 255, prefix > 32, IPv6; `entryCovers` ở biên `/0` (khớp tất cả) và `/32` (khớp đúng một); `hostCount`.
- `next build` + eslint.
- Dev server do người dùng tự chạy — spec này không tự khởi động server nào.
