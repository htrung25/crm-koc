# Chuyển ngôn ngữ Việt / Anh cho frontend CRM-KOC

Ngày: 2026-08-06
Phạm vi: `frontend/`

## 1. Mục tiêu

Cho phép người dùng chuyển toàn bộ giao diện giữa tiếng Việt và tiếng Anh.

**Hiện trạng đo được:**

- 56 file chứa tiếng Việt, ~340 chuỗi hiển thị (một phần lớn số dòng khớp là *comment*, không cần dịch)
- Chưa cài thư viện i18n nào
- `<html lang="vi">` cứng trong root layout
- 6 chỗ hardcode locale: `Intl.DateTimeFormat("vi-VN")`, `Intl.NumberFormat("vi-VN")`, `toLocaleLowerCase("vi")`, `toLocaleUpperCase("vi")`
- 32 đường dẫn nội bộ hardcode ở 10 file
- 7 page

**Hai thứ đã có sẵn, tận dụng lại:**

- `lib/utils/format.ts` → `formatCurrency(amount, locale: "vi" | "en")` đã có tham số locale, chỉ chưa ai truyền
- `components/admin/admin-profile-panel.tsx:340` đã có `<select>` chọn ngôn ngữ đang `disabled`

## 2. Bốn quyết định đã chốt

| # | Quyết định |
|---|---|
| 1 | Phạm vi: **toàn bộ ứng dụng** — marketing, auth, admin |
| 2 | Định tuyến: **có đoạn URL** `/vi`, `/en` (`app/[locale]/...`) |
| 3 | Thư viện: **next-intl** |
| 4 | Lỗi: dịch theo `businessCode`, mã chưa có thì giữ nguyên message thô |

Quyết định 2 chọn URL segment vì phạm vi gồm cả landing page: mỗi ngôn ngữ cần một URL riêng để Google đánh chỉ mục, và chia sẻ link phải giữ đúng ngôn ngữ. Chỉ có 7 page nên chi phí dịch chuyển thấp.

## 3. Cấu trúc

```
messages/
  vi.json
  en.json
i18n/
  routing.ts       locales + defaultLocale
  request.ts       getRequestConfig cho Server Component
  navigation.ts    Link / redirect / useRouter đã bọc locale
app/[locale]/      7 page chuyển vào đây
app/api/           GIỮ NGUYÊN — không nằm dưới [locale]
```

**`app/api/` phải nằm ngoài `[locale]`.** Route Handler không được gắn tiền tố locale; kéo vào thì mọi lời gọi `/api/admin/...` từ client sẽ 404.

## 4. Định tuyến — phần rủi ro cao nhất

`proxy.ts` (Next 16 đổi tên từ `middleware.ts`) đang gác đăng nhập theo cookie. next-intl cũng cần middleware để phân giải locale. **Hai thứ phải lồng trong cùng một `proxy.ts`**: next-intl chạy trước để xác định locale và rewrite, rồi logic gác auth chạy trên đường dẫn đã bỏ tiền tố.

Kéo theo:

- 5 matcher trong `proxy.ts`: `/admin/:path*`, `/creator/:path*`, `/brand/:path*`, `/login`, `/register`
- `ROLE_HOME` trong `features/auth/types.ts`
- 32 đường dẫn hardcode ở 10 file → thay bằng `Link` / `redirect` từ `i18n/navigation.ts`

File có đường dẫn hardcode: `app/page.tsx`, `components/layout/red-sun-nav.tsx`, `components/layout/app-shell.tsx`, `components/admin/{admin-profile-panel,admin-sidebar,admin-security-manager,admin-topbar}.tsx`, `components/marketing/pricing-section.tsx`, `features/auth/components/{editorial-login,editorial-register}.tsx`

## 5. Dịch lỗi theo `businessCode`

Thêm namespace `errors` vào file dịch, khoá theo mã máy ổn định:

```json
"errors": {
  "IP_WHITELIST_WOULD_LOCK_YOU_OUT": "Thay đổi này sẽ khoá bạn ra ngoài. IP hiện tại {clientIp} không nằm trong danh sách mới.",
  "INVALID_CIDR_FORMAT": "Dải CIDR không hợp lệ: {entry}",
  "INVALID_IP_FORMAT": "Địa chỉ IP không hợp lệ: {entry}",
  "SUPER_ADMIN_REQUIRED": "Chỉ super admin mới thay đổi được dữ liệu này."
}
```

Helper `translateError(code, rawMessage, params)`: có khoá thì dịch, không có thì trả `rawMessage` — giữ nguyên hành vi hiện tại cho phần chưa có mã.

Cách này sửa luôn một lỗi **đang tồn tại**: hôm nay người dùng tiếng Việt vẫn thấy `Invalid CIDR format: 1.2.3.4/33` và `REQUIRES_SUPER_ADMIN` bằng tiếng Anh.

**Hạn chế đã biết:** backend nhét phần tử lỗi vào *câu chữ* (`Invalid CIDR format: 1.2.3.4/33`) chứ không trả field riêng, nên `{entry}` phải cắt từ chuỗi sau dấu `": "`. Chạy được nhưng mong manh. Cách bền là xin backend thêm field `entry` có cấu trúc — làm sau, không chặn việc này.

## 6. Định dạng số / ngày

Thay bằng `useFormatter` (Client) và `getFormatter` (Server) của next-intl:

| File | Chỗ cần sửa |
|---|---|
| `app/layout.tsx` | `<html lang="vi">` → `lang={locale}` |
| `components/admin/admin-profile-panel.tsx` | `Intl.DateTimeFormat("vi-VN")`, `toLocaleUpperCase("vi")` |
| `components/marketing/pricing-section.tsx` | `Intl.NumberFormat("vi-VN")` |
| `components/admin/admin-security-manager.tsx` | `toLocaleLowerCase("vi")` (×2, dùng cho tìm kiếm) |
| `lib/utils/format.ts` | truyền locale vào `formatCurrency` (tham số đã có) |

## 7. Nút chuyển ngôn ngữ

- Kích hoạt `<select>` đang `disabled` ở `admin-profile-panel.tsx:340`
- Thêm một nút ở `components/layout/red-sun-nav.tsx` cho khách chưa đăng nhập

next-intl tự ghi cookie `NEXT_LOCALE` để nhớ lựa chọn giữa các phiên.

## 8. Thứ tự thực hiện

| Bước | Nội dung | Vì sao tách riêng |
|---|---|---|
| 1 | Cài next-intl, dựng khung (`messages/`, `i18n/`, `app/[locale]/`, `proxy.ts`), **chưa dịch chữ nào** | Rủi ro tập trung ở định tuyến. Hỏng thì hỏng ngay và rõ, không lẫn vào 340 thay đổi chuỗi. App vẫn chạy tiếng Việt như cũ sau bước này. |
| 2 | Rút chuỗi khu admin (~105) | Khu làm việc chính |
| 3 | Rút chuỗi auth (~85) | Vào được admin mà kẹt ở cổng đăng nhập thì vô nghĩa |
| 4 | Rút chuỗi marketing (~150) | |
| 5 | Dịch lỗi theo `businessCode` | |
| 6 | Định dạng số/ngày + nút chuyển | |

## 9. Kiểm chứng

- `npx tsc --noEmit` sạch sau mỗi bước
- `npm run build` thành công; route liệt kê đủ cả `/vi` và `/en`
- Sau bước 1: mọi trang vẫn hiển thị tiếng Việt y như trước, không sót đường dẫn nào 404
- Sau bước 6: đổi ngôn ngữ trên UI thì số, ngày, và thông báo lỗi đều đổi theo
