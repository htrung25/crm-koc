# CRM KOC — Mobile app

Expo (SDK 57) + expo-router + TypeScript. Nói chuyện với API NestJS ở `../api`.

## Chạy dự án

```bash
cp .env.example .env      # sửa EXPO_PUBLIC_API_URL cho đúng máy của bạn
npm install
npm run ios               # hoặc: npm run android
```

Dùng **dev build**, không phải Expo Go (`expo-secure-store` cần native module).
Lần đầu chạy `npm run ios` / `npm run android` sẽ tự prebuild và cài lên máy.

Máy Android thật hoặc emulator không thấy `localhost` của máy dev — đặt
`EXPO_PUBLIC_API_URL` thành IP LAN, ví dụ `http://192.168.1.10:3000`.

## Kiểm tra trước khi push

```bash
npm run check    # typecheck + lint + format:check
```

## Cấu trúc

```
src/
  app/            route của expo-router — file mỏng, chỉ compose từ features/
    (auth)/       login, verify-otp — chỉ vào được khi CHƯA đăng nhập
    (app)/        màn hình sau đăng nhập — chỉ vào được khi ĐÃ đăng nhập
  features/       mỗi feature tự chứa: api/ components/ hooks/ model/
  shared/         hạ tầng dùng chung: api, i18n, storage, theme, ui
  config/         đọc và validate biến môi trường
```

### Quy ước

- Import và re-export nội bộ dùng alias `@/` (trỏ tới `src/`), không dùng
  `./` hoặc `../`. Ví dụ: `@/shared/ui`, `@/features/auth/model/types`.
  Package bên ngoài vẫn dùng tên package như `react`, `axios`.
- Trong cùng feature được import trực tiếp file bằng `@/features/<name>/...`.
- `.prettierrc` nạp plugin cục bộ `scripts/prettier-plugin-import-alias.cjs`:
  khi format file TypeScript/TSX trong `src/`, import/re-export tương đối tự đổi
  sang alias theo `tsconfig.json`, bao gồm `import()` và `require()` với chuỗi
  đường dẫn cố định. Giữ nguyên thứ tự import và tên package bên ngoài.
  Chạy `npm run format` để áp dụng toàn bộ mobile project; editor cần dùng
  Prettier của project và cấu hình `.prettierrc` này.
- **Không đặt logic trong `src/app`.** Route chỉ lắp ráp; màn hình thật nằm ở
  `features/<name>/components`.
- **Import chéo feature phải qua public API**: `@/features/auth`, không phải
  `@/features/auth/model/session-store`. ESLint chặn việc này.
- `shared/` không được import từ `features/`. Cần gọi ngược thì dùng cầu nối
  như `shared/api/session-bridge.ts`.
- Đặt tên file kebab-case.

### Thêm một feature mới

1. `src/features/<name>/` với `api/` (gọi HTTP + query keys), `model/`
   (type, zod schema, store), `hooks/` (React Query), `components/`.
2. Export những gì bên ngoài được dùng trong `src/features/<name>/index.ts`.
3. Thêm route mỏng trong `src/app/(app)/`.
4. Thêm key i18n vào cả `shared/i18n/locales/vi.json` và `en.json`.

## Auth

API bắt buộc qua OTP: `POST /login/brand-creator` → `POST /verify-otp` mới trả
token. Access token sống 15 phút, refresh token **xoay vòng mỗi lần dùng** và
dùng lại token cũ sẽ bị huỷ toàn bộ phiên — vì vậy `shared/api/client.ts` gom
mọi request 401 về đúng một lần gọi `/refresh` (single-flight) rồi replay.

Token nằm trong `expo-secure-store`. Mỗi máy có một `X-Device-Id` bền vững,
server đối chiếu khi refresh.

Logout chủ động và hết phiên tự động đều đi qua `session-store.signOut()`:
xóa account, token và toàn bộ query/mutation cache của app. Query đang chạy
được hủy; response và refresh thuộc phiên cũ không được cập nhật phiên mới.
`/auth/me` có query key theo phiên để lần đăng nhập sau không dùng dữ liệu cũ.
Device ID được giữ lại vì thuộc thiết bị, không thuộc tài khoản.

## Giao diện theo vai trò

Khách mở app vào `/welcome`; nút bỏ qua dẫn tới `/login`. `/login` và `/sign-in`
cùng dùng form RedSun trong `features/auth`; `/register` gọi API đăng ký và chuyển
sang OTP. Các route này được guard, người đã đăng nhập được chuyển về `/dashboard`.

Sau OTP hoặc khôi phục session, app nạp account và điều hướng theo `accountRole`
của API: `creator` → `/creator`, `brand` → `/brand`. Role dùng chữ thường; trạng
thái account là số: PENDING=1, ACTIVE=2, SUSPENDED=3, BANNED=4. Response OTP và
`/auth/me` được kiểm tra bằng Zod trước khi lưu vào session.

- Creator: feed Discover theo thiết kế, tìm kiếm/lọc chiến dịch và KOC, banner
  thống kê, avatar tài khoản và các tab riêng. Feed thuộc `features/creator`, chỉ
  truy cập sau đăng nhập đúng role. Danh sách đang dùng dữ liệu mẫu; chi tiết,
  chiến dịch của tôi và ví chưa nối API.
- Brand: màn tổng quan, chiến dịch, danh sách Creator và tài khoản trong
  `features/brand`, với dữ liệu mẫu. Creator không truy cập được khu vực Brand
  và ngược lại.
- `features/auth` sở hữu form đăng nhập/đăng ký, OTP và session. Không còn
  `features/discover`, `features/entry` hoặc màn hoàn tất mô phỏng `/complete`.
- Onboarding vẫn ở `features/onboarding`. App trở lại từ background khi chưa
  đăng nhập sẽ đóng các form khách và trở về `/welcome`.

Ảnh sản phẩm đang là placeholder; Google/TikTok, quên mật khẩu và các nội dung
chưa kết nối hiển thị thông báo. Các màn dùng token `shared/theme/brand.ts` và
các thành phần ở `shared/ui`; bản dịch có `vi` và `en`.

### Lỗi API trên mobile

`toApiError()` giữ toàn bộ response body trong `ApiError.payload` (kiểu `unknown`).
Các trường đã chuẩn hóa: `businessCode`, `errors` (mỗi lỗi giữ `code`, `fieldPath`,
`message`, `metadata`), `resourceStatus` và `version`. `status` luôn là HTTP status;
HTTP 409 có `kind: 'conflict'`. Dùng `businessCode` để phân nhánh nghiệp vụ, không
so khớp chuỗi thông báo. Trường mở rộng hoặc dữ liệu không đúng schema vẫn còn
trong `payload`; cần kiểm tra kiểu trước khi sử dụng.

`details` giữ mảng thông báo validation của Nest. `messages` tổng hợp thông báo
chung, `details` và thông báo theo trường, bỏ trùng; `FormError` hiển thị danh sách
này. Không hiển thị hoặc log toàn bộ payload vì có thể chứa dữ liệu nhạy cảm.
Chạy `npm run test:api-errors` để kiểm tra contract và hiển thị form.
