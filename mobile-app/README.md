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

## Giao diện RedSun (dữ liệu mẫu)

Khi mở app, chờ khôi phục session: khách được chuyển tới `/welcome`, người đã đăng
nhập tới `/dashboard`. Mỗi lần app từ background trở lại foreground, nếu chưa đăng
nhập sẽ quay về `/welcome` và đóng các form khách đang mở. Không lưu cờ “đã xem
onboarding”. Mở hộp thoại hệ thống/Notification Center (chỉ `inactive`) không reset
màn hình. Nút “Bỏ qua” vẫn cho phép xem Discover tại `/` trong lần sử dụng hiện tại.

Các route công khai:

- `/`: tìm kiếm và lọc chiến dịch/KOC, banner thống kê, thanh điều hướng khách.
- `/welcome`: 3 slide onboarding, tự chuyển mỗi 4,2 giây; có điều khiển thủ công,
  dừng khi màn hình mất focus và tôn trọng Reduce Motion.
- `/register`: chọn KOC/Thương hiệu, kiểm tra thông tin và điều khoản bằng Zod.
- `/sign-in`: form đăng nhập mô phỏng, hiện/ẩn mật khẩu, lựa chọn ghi nhớ.
- `/complete`: hoàn tất xem thử; không gửi email, tạo session hoặc lưu mật khẩu.

Các tab khách và thẻ nội dung dẫn đến form theo bản phác thảo. Google/TikTok,
khôi phục mật khẩu và nội dung pháp lý hiện có thông báo về trạng thái chưa kết nối.
Ảnh sọc là placeholder có chủ đích từ HTML. Dùng font hệ thống native; chưa kèm
font Be Vietnam Pro hoặc ảnh sản phẩm chính thức.

`features/discover` sở hữu fixtures và bộ lọc; `features/onboarding` sở hữu carousel;
`features/entry` sở hữu form mô phỏng, tách biệt `features/auth` đang dùng REST API.
Các màn dùng token `shared/theme/brand.ts` và thành phần dùng chung ở `shared/ui`.
Toàn bộ chuỗi giao diện có bản dịch `vi` và `en`. Giao diện công khai giữ bảng màu
sáng như thiết kế, không phụ thuộc chế độ tối của thiết bị.

Luồng API cũ vẫn ở `/login` → `/verify-otp` → `/dashboard` (có session guard).
Không gọi các hook API từ màn hình công khai. Khi nối API, thay hành động submit
trong feature entry bằng các hook xác thực; không thêm HTTP vào file route.
