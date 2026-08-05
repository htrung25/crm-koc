# Project Handoff

> Lập ngày 2026-08-05. Mọi trạng thái đã xác minh bằng `git status`, đọc lại file,
> đọc lại file, truy vấn DB và chạy lint/typecheck/test/build tại thời điểm viết.
> Chỗ nào chưa xác minh đều được ghi rõ.

---

## 1. Mục tiêu hiện tại

**Dự án:** CRM-KOC — nền tảng kết nối Brand và KOC (creator). Monorepo hai phần:

- `api/` — NestJS 11 + TypeORM + PostgreSQL 18 + Redis (node-redis)
- `frontend/` — Next.js App Router, dùng mô hình BFF (trình duyệt → Route Handler → NestJS)

**Việc đang xử lý:** dựng UI cho phép **super admin cấu hình IP whitelist** của các
tài khoản admin. Backend đã xong; frontend mới hoàn thành 2/8 task theo plan.

**Kết quả cuối cùng cần đạt:** trang `/admin/security` đọc và ghi được IP whitelist
thật qua API (thay cho dữ liệu mock hiện tại), có xử lý ca tự khoá (422) và phân
quyền super admin.

**Bối cảnh song song:** module `social/` (kết nối TikTok qua OAuth) đã dựng xong phần
lõi ở phiên trước và đã commit; không phải trọng tâm hiện tại.

---

## 2. Công việc đã hoàn thành

### 2.1. IP Whitelist — backend (đã commit `c3f36a1`, `50747ec`)

| File | Thay đổi |
|---|---|
| `api/src/module/admin/ip-whitelist.service.ts` | Bỏ `addEntry`; thêm `setWhitelist()` (ghi đè cả chuỗi CSV), `removeEntry()`, `getManyByAdminIds()`, `assertShape()`, `normalizeEntry()`, `normalizeIp()`, `listAllows()`, `assertReachable()` |
| `api/src/module/admin/admin.controller.ts` | Thêm `GET /admin/:id`, `PATCH /admin/:id`, `DELETE /admin/:id/ip-whitelist` |
| `api/src/module/admin/admin.service.ts` | Thêm `findAdminById()`, `updateAdmin()`, `removeIpWhitelistEntry()`, `requireAdmin()`, `toAdminResponse()`; `findAll()` gộp `ipWhitelist` bằng một truy vấn |
| `api/src/module/admin/dto/update-admin.dto.ts` | **File mới** — `ipWhitelist?`, `acknowledgeSelfLockout?` |
| `api/src/module/admin/dto/remove-ip-whitelist.dto.ts` | **File mới** — query DTO `entry`, `acknowledgeSelfLockout` |
| `api/src/module/admin/dto/admin-response.dto.ts` | Thêm `ipWhitelist`, `adminRole` |
| `api/src/common/enum/business-code.enum.ts` | Thêm `IP_WHITELIST_WOULD_LOCK_YOU_OUT` |

### 2.2. Phân cấp Super Admin (CHƯA COMMIT)

| File | Trạng thái | Thay đổi |
|---|---|---|
| `api/src/module/admin/super-admin.guard.ts` | **untracked** | Guard mới, đọc `admin_users.admin_role` từ DB |
| `api/migrations/1785899457382-add_admin_role.ts` | **untracked** | Thêm cột `admin_role` + CHECK, nâng admin cũ nhất lên `super_admin` |
| `api/src/module/admin/enum/admin-roles.enum.ts` | modified | Thêm `ADMIN = 'admin'` (trước chỉ có `SUPER_ADMIN`) |
| `api/src/module/admin/entities/admin_user.entity.ts` | modified | Thêm cột `adminRole` |
| `api/src/module/admin/admin.controller.ts` | modified | Gắn `SuperAdminGuard` vào `PATCH /:id` và `DELETE /:id/ip-whitelist` |
| `api/src/module/admin/admin.module.ts` | modified | Đăng ký `SuperAdminGuard` |
| `api/scripts/create-superadmin.sql` | modified | Insert kèm `admin_role = 'super_admin'` |

### 2.3. Gỡ `AdminSessionScope` (CHƯA COMMIT)

| File | Thay đổi |
|---|---|
| `api/src/common/enum/admin-scopes.enum.ts` | **đã xoá** |
| `api/src/security/session.service.ts` | Bỏ `scopes` khỏi interface `AdminSession` |
| `api/src/security/jwt-auth.service.ts` | Bỏ `scopes` khỏi `AccessTokenPayload`, `LoginContext`, tham số `signPair()` |

### 2.4. Frontend (đã commit `251a530`, `a349d6f`, `9249881`)

| File | Thay đổi |
|---|---|
| `frontend/features/admin/ip-whitelist/whitelist.ts` | **File mới** — `parseWhitelist`, `serializeWhitelist`, `validateEntry`, `normalizeCidr`, `hostCount`, `entryCovers`, `MAX_WHITELIST_LENGTH` |
| `frontend/features/admin/ip-whitelist/whitelist.test.ts` | **File mới** — 25 test Vitest |
| `frontend/lib/api/client.ts` | `ApiError` giữ body lỗi, thêm getter `businessCode` và `clientIp` |
| `frontend/lib/api/client.test.ts` | 8 test |
| `frontend/package.json` | Thêm Vitest, script `test` / `test:watch` |

### 2.5. Tài liệu (đã commit)

- `frontend/docs/superpowers/designs/2026-08-05-admin-ip-whitelist-ui-design.md` — spec
- `frontend/docs/superpowers/plans/2026-08-05-admin-ip-whitelist-ui.md` — plan 8 task

---

## 3. Quyết định kỹ thuật

### 3.1. IP whitelist không phải resource riêng

Lưu ở **một cột text** `admin_users.ip_whitelist` dạng CSV. Không có bảng con, không
có `ip-whitelist.controller.ts`. Sửa qua chính endpoint sửa admin user.

**Đã loại bỏ:** bảng chuẩn hoá `admin_ip_whitelist`. Lý do loại: đã chọn CSV từ đầu,
tách bảng sẽ phải viết lại service và migrate dữ liệu.
**Cái giá đã chấp nhận:** DB không chặn được trùng lặp (phải khử ở application), và
không lọc được theo subnet — chỉ so chuỗi.

### 3.2. Ngữ nghĩa GHI ĐÈ, không phải thêm

`PATCH /admin/:id` với `ipWhitelist` thay **toàn bộ** chuỗi. Thêm một IP = đọc → nối
vào mảng → gửi lại cả chuỗi. `""` → cột về `null`.

**Quy ước bất di bất dịch:** danh sách rỗng/null = **CHO PHÉP MỌI IP**, không phải
chặn hết. Mọi chỗ hiển thị phải nói rõ.

`DELETE` tồn tại song song vì khác nhau về tranh chấp: `PATCH` ghi đè nên người lưu
sau xoá sạch thay đổi của người trước; `DELETE` server đọc-sửa-ghi trên giá trị mới
nhất nên không đụng phần tử người khác vừa thêm.

**Không có `POST`** để thêm một phần tử — đã cân nhắc và loại, thêm đi qua `PATCH`.

### 3.3. Validate nghiêm hơn thư viện `netmask`

`netmask` im lặng đoán ý: `10` → `0.0.0.10/32`, `192.168.1` → `192.168.0.1/32`.
`assertShape()` chặn trước: đủ 4 octet, mỗi octet ≤ 255, prefix ≤ 32. **Chặn luôn
IPv6** vì guard chỉ quy đổi được `::1` và `::ffff:x.x.x.x`.

Backend **chuẩn hoá host bits**: `10.0.0.5/24` → lưu `10.0.0.0/24`, để thứ nhìn thấy
bằng đúng thứ được thực thi. Khử trùng lặp **sau** chuẩn hoá.

### 3.4. Bất biến chống tự khoá

Chỉ áp khi `:id` là **chính người gọi**. Sửa cho admin khác thì IP người sửa không
liên quan. Vi phạm → **422** + `IP_WHITELIST_WOULD_LOCK_YOU_OUT` + `clientIp` (đã
chuẩn hoá). Vượt qua bằng `acknowledgeSelfLockout: true`, có ghi log cảnh báo.

`clientIp` lấy từ `extractClientIp(request)`, **không** nhận từ body — để client tự
khai IP thì bất biến vô nghĩa.

### 3.5. Phân cấp admin bằng `EAdminRole`, không dùng scope

Lưu ở `admin_users.admin_role` (varchar + CHECK), **không** ở `accounts.account_role`
— cột đó phân biệt ba actor và nhiều chỗ `switch` không có nhánh `default`.

`SuperAdminGuard` đọc DB mỗi request thay vì tin JWT: **hạ quyền có hiệu lực ngay**,
không chờ token 15 phút hết hạn.

**Đã loại bỏ `AdminSessionScope`** (`admin:read/write/delete`): nó được ký vào mọi
JWT và lưu Redis nhưng `context.scopes` chưa bao giờ được nạp — luôn là mảng rỗng, và
không nơi nào đọc để phân quyền. Gỡ đi cũng loại luôn lỗi `cjson` biến `[]` thành
`{}` sau lần refresh đầu.

### 3.6. Quy ước chung phải tiếp tục tuân thủ

- Import **luôn dùng đường dẫn tương đối**, không bao giờ `from 'src/...'`
- Enum khai tay trong `src/common/enum/`, tiền tố `E`
- Bảng SQL tên `accounts` nhưng class/biến giữ tiền tố `auth`
- **Enum ở tầng DB dùng `varchar` + `CHECK`**, không dùng enum type của Postgres
- Migration là nguồn sự thật; sinh file bằng `node scripts/generate-migration.js <ten>`
- Không tự chạy/tắt server — user tự chạy
- Verify bằng `tsc`, `jest`/`vitest`, hoặc script ts-node + supertest với `app.init()`

---

## 4. Trạng thái code hiện tại

**Branch:** `feat/admin-ip-whitelist-ui` (nhánh chính của repo là `develop`)

**Commit gần nhất:**
```
9249881 test: add malformed body coverage for ApiError getters
a349d6f feat(api): ApiError giữ businessCode và clientIp từ body lỗi
130fad1 docs: plan dùng react-query cho mutation, ghi nhận lệch khỏi skill route-handlers
251a530 feat(admin): logic thuần cho IP whitelist + Vitest
a547461 docs: plan triển khai UI IP whitelist (8 task)
```

**`git status --short` (chạy lúc bàn giao):**
```
 M api/scripts/create-superadmin.sql
 D api/src/common/enum/admin-scopes.enum.ts
 M api/src/main.ts
 M api/src/module/admin/admin.controller.ts
 M api/src/module/admin/admin.module.ts
 M api/src/module/admin/entities/admin_user.entity.ts
 M api/src/module/admin/enum/admin-roles.enum.ts
 M api/src/module/auth/auth.controller.ts
 M api/src/module/auth/dto/login.dto.ts
 M api/src/security/jwt-auth.service.ts
 M api/src/security/session.service.ts
 M api/swagger/openapi.json
 D frontend/README.md
 M frontend/config/admin/navigation.ts
 M frontend/lib/api/client.ts
?? .claude/
?? AGENTS.md
?? CLAUDE.md
?? api/migrations/1785899457382-add_admin_role.ts
?? api/src/module/admin/super-admin.guard.ts
```

**Chưa commit — nhóm theo chủ đề:**

1. **Super admin** (nên commit thành một đơn vị): `super-admin.guard.ts`,
   `add_admin_role.ts`, `admin-roles.enum.ts`, `admin_user.entity.ts`,
   `admin.controller.ts`, `admin.module.ts`, `create-superadmin.sql`
2. **Gỡ AdminSessionScope**: `admin-scopes.enum.ts` (deleted),
   `jwt-auth.service.ts`, `session.service.ts`
3. **Chưa rõ nguồn gốc** (thay đổi của user, tôi chưa đọc diff):
   `api/src/main.ts`, `api/src/module/auth/auth.controller.ts`,
   `api/src/module/auth/dto/login.dto.ts`, `frontend/config/admin/navigation.ts`,
   `frontend/lib/api/client.ts`
4. **Cần quyết định**: `frontend/README.md` bị xoá, `.claude/`, `AGENTS.md`,
   `CLAUDE.md` chưa được track

---

## 5. Những việc chưa hoàn thành

### 5.1. Task 4–8 của plan frontend (việc chính)

Plan đầy đủ: `frontend/docs/superpowers/plans/2026-08-05-admin-ip-whitelist-ui.md`

**Task 4 — Types + Route Handler**
- File: `frontend/features/admin/ip-whitelist/types.ts` (chưa tồn tại),
  `frontend/app/api/admin/...` (thư mục `app/api/admin/` **rỗng**)
- Triển khai: Route Handler đọc cookie token, gọi `apiRequest` kèm **`clientContext`**
- Hoàn thành khi: gọi được `GET`/`PATCH`/`DELETE` xuyên BFF và nhận đúng body

**Task 5 — Hook `useIpWhitelist`**
- File: `frontend/features/admin/ip-whitelist/use-ip-whitelist.ts` (chưa tồn tại)
- Plan ghi nhận đã chốt dùng **react-query cho mutation** (commit `130fad1`)
- Hoàn thành khi: hook quản lý chip-list, submit, và bắt được 422

**Task 6 — `SelfLockoutDialog`**
- File: chưa tồn tại
- Hoàn thành khi: nhận 422 → hiện dialog với `clientIp`, có nút "Thêm IP hiện tại"
  (chính) và "Vẫn tiếp tục" (phụ, cần tick xác nhận)

**Task 7 — Viết lại `IpWhitelistManager`**
- File: `frontend/components/admin/ip-whitelist-manager.tsx` — **đang dùng mock**,
  import `IpWhitelistEntry` từ `@/lib/mock/admin/ip-whitelist`, state cục bộ hoàn toàn
- Hoàn thành khi: không còn import từ `lib/mock`, mọi thao tác gọi API thật

**Task 8 — Nối trang `/admin/security` và xoá mock**
- File: `frontend/app/admin/(dashboard)/security/page.tsx` — đang import
  `IP_WHITELIST` từ `@/lib/mock/admin/ip-whitelist`
- Hoàn thành khi: trang đọc dữ liệu thật, thư mục mock bị xoá

### 5.2. Commit phần super admin và gỡ scope

- Hoàn thành khi: `git status` sạch cho hai nhóm 1 và 2 ở mục 4

### 5.3. Không có API phong super admin

- File: `api/src/module/admin/dto/update-admin.dto.ts`
- Hiện chỉ nâng quyền được bằng migration hoặc SQL tay
- Triển khai dự kiến: thêm `adminRole?` vào `UpdateAdminDto` — **cân nhắc kỹ**, đây
  là đường leo thang quyền
- Hoàn thành khi: có endpoint, có test cho ca admin thường tự nâng mình

### 5.4. `adminRole` thiếu ở endpoint danh sách

Ba endpoint đơn lẻ **đã trả** `adminRole` (xác minh bằng `grep` trên
`admin.service.ts` lúc bàn giao): `findAdminById()`, `updateAdmin()`,
`removeIpWhitelistEntry()`. `IpWhitelistService.getSecurityInfo()` lấy cả
`adminRole` lẫn whitelist trong một truy vấn; `setWhitelist()`/`removeEntry()` trả
`adminRole` từ chính dòng vừa đọc/ghi nên không đọc lại.

**Còn thiếu:** `findAll()` (`GET /admin/admin-list`).
- File: `api/src/module/admin/admin.service.ts`, type `AdminListRow` ở dòng 44 —
  hiện là `AuthEntity & { ipWhitelist: string | null }`, **không có** `adminRole`
- Hệ quả: `AdminResponseDto.adminRole` khai bắt buộc nên Swagger đang nói sai về
  endpoint danh sách
- Triển khai dự kiến: mở rộng `getManyByAdminIds()` trả cả `adminRole` (đang chỉ
  trả `ipWhitelist`), rồi gộp vào `AdminListRow`
- Hoàn thành khi: UI hiển thị được huy hiệu super admin trong danh sách mà không
  phải gọi thêm `GET /admin/:id` cho từng dòng

### 5.5. Nợ cũ chưa xử lý

| Việc | File | Ghi chú |
|---|---|---|
| Global exception filter | chưa có | Lỗi hiện có **hai hình dạng** khác nhau |
| Throttler không có try/catch | `api/src/security/throttler-redis.storage.ts` | Redis chết → **mọi** request 500, kể cả `/login` |
| `SessionService` không có try/catch | `api/src/security/session.service.ts` | Redis lỗi → 500 thay vì 401 |
| `accountCache.invalidate()` không có try/catch | `api/src/security/account-cache.service.ts` | Ban thành công một nửa |
| `accounts.status` thiếu CHECK | migration `create_accounts` | Ghi được `status = 7` |
| `validateAccessToken()` là mã chết | `api/src/security/jwt-auth.service.ts` | Comment ở dòng ~123 mô tả sai kiến trúc |
| Job đồng bộ social | chưa có | `refreshAccessToken()` đã có nhưng chưa ai gọi; token TikTok chết sau 24h |
| Cổng frontend chưa ghim | `frontend/package.json` | `SOCIAL_OAUTH_CALLBACK_BASE_URL` trỏ `:3001` theo phỏng đoán |
| Trang callback OAuth | chưa có | `next build` không liệt kê route nào cho social callback |

(Có hàm try/catch dùng chung ở common/service/redis.service.ts)
---

## 6. Lỗi hoặc vấn đề còn tồn tại

### 6.1. ESLint warning (đang tồn tại, không phải lỗi)

```
api/src/main.ts
  64:1  warning  Promises must be awaited... @typescript-eslint/no-floating-promises
```
Có từ trước, chưa xử lý. **0 error.**

### 6.2. Migration: tên class lệch với `name` property

`api/migrations/1785730149322-create_profiles_per_role.ts`:
```ts
export class CreateProfilesPerRole1785730149322 ...
  name = 'SplitProfilesPerRole1785730149322';   // <- DB ghi tên này
```
DB có bản ghi `SplitProfilesPerRole1785730149322`. TypeORM ưu tiên `name` nên **hiện
không sao**. **Bẫy:** nếu ai đó "sửa cho khớp" thành `CreateProfilesPerRole...`,
TypeORM sẽ coi là migration mới và chạy lại → hỏng vì bảng đã tồn tại.

### 6.3. Bảng `migrations` có bản ghi mồ côi (đã xử lý)

`CreateAccountProfiles1785024001000` đã được `SplitProfilesPerRole` xoá khỏi bảng
`migrations`. Xác minh: truy vấn hiện chỉ trả 8 dòng khớp 8 file.

### 6.4. Cách đã thử nhưng KHÔNG thành công

- **File `express.d.ts` augment global `Express.Request`**: bị loại. Optional
  properties (`user?`, `admin?`) không chặn được lỗi đọc nhầm guard — đọc sai vẫn
  compile, chỉ ra `undefined`. Thay bằng type cục bộ + fail-closed ở runtime.
- **`GET /admin/:id` khai trước các route danh sách**: sẽ nuốt `/admin-list` vì cùng
  method GET và cùng số đoạn. Hiện đã đặt **sau** (dòng 162, sau 58/70/82).
- **Cột `admin_role` đặt ở `accounts.account_role`**: bị loại, sẽ phá mọi `switch`
  trên ba vai trò.

### 6.5. Chưa có runtime error nào được ghi nhận

Không chạy server trong phiên này (quy ước: user tự chạy).

---

## 7. Database và infrastructure

### 7.1. PostgreSQL

**Phiên bản 18.4 (Homebrew).** Cluster 17 cũ đã bị xoá vĩnh viễn ở phiên trước.
`psql` **không có trong PATH** — dùng `/opt/homebrew/opt/postgresql@18/bin/psql`.

**Bảng hiện có (xác minh bằng `pg_tables`):**
```
accounts · admin_users · brand_profiles · creator_profiles
session_events · social_accounts · migrations
```

**Migration — 8 file, cả 8 ĐÃ CHẠY** (xác minh bằng `SELECT * FROM migrations`):
```
CreateAccounts1785024000000
CreateSessionEvents1785603284060
CreateAdminUsers1785666733501
AddAdminUserStatus1785670164268
UseUuidv7Defaults1785670165304
SplitProfilesPerRole1785730149322      (file: create_profiles_per_role.ts)
CreateSocialAccounts1785744484015
AddAdminRole1785899457382              (file UNTRACKED)
```

**Lưu ý:** `AddAdminRole` đã chạy trên DB local nhưng **file chưa commit**. Máy khác
pull code sẽ không có migration này.

**Không có script `migration:run`** trong `package.json`, không có data-source cho
TypeORM CLI, `migrationsRun: false`. Cách đã dùng: tạo file tạm ở gốc `api/` với một
`DataSource` đọc `.env`, chạy `npx ts-node -T`, rồi xoá.

**`admin_users` (bảng gộp — vừa cấu hình bảo mật vừa hồ sơ admin):**
```
account_id (PK/FK) · ip_whitelist · status · admin_role
name · email · avatar_url · timezone · updated_at
```
Không có `address`/`gender` — cố ý.

**Dữ liệu hiện tại:** 1 account. `admin@gmail.com` / `abc@12345`,
`admin_role = super_admin`, `ip_whitelist = NULL`.

⚠️ `abc@12345` **không qua `PASSWORD_REGEX`** (thiếu chữ hoa). Login vẫn được vì
`/login` không đi qua `ValidationPipe`.

### 7.2. Redis

node-redis (**không phải ioredis**). Cú pháp `set(k, v, { EX: seconds })`.
Dùng cho: phiên, throttler, cache account, OAuth state của social.

### 7.3. Environment variables

`api/.env` đã có (`.env.example` đã cập nhật):
```
SOCIAL_TOKEN_ENCRYPTION_KEY          khoá AES-256-GCM 32 byte base64 (THẬT)
SOCIAL_OAUTH_CALLBACK_BASE_URL       http://localhost:3001/social/callback
TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET   user đã điền giá trị thật
SESSION_TOUCH_INTERVAL_SECONDS       mặc định 300, CHƯA có trong .env
```

### 7.4. Dependency mới

`uuid@^14.0.1` (API — sinh UUID v7), `vitest@3.2.7` (frontend)

---

## 8. API và contract

### 8.1. Endpoint IP whitelist

```
GET    /admin/:id
       -> AdminResponseDto (có ipWhitelist, adminRole)
       Guard: JwtAuthGuard + RolesGuard(ADMIN) + IpWhitelistGuard
       Admin THƯỜNG xem được (cố ý)

PATCH  /admin/:id
       body { ipWhitelist?: string, acknowledgeSelfLockout?: boolean }
       -> AdminResponseDto (KHÔNG có adminRole — xem 5.4)
       Guard: + SuperAdminGuard

DELETE /admin/:id/ip-whitelist?entry=<ip|cidr>&acknowledgeSelfLockout=<bool>
       -> AdminResponseDto
       Guard: + SuperAdminGuard
       entry đi bằng QUERY vì CIDR chứa '/'

GET    /admin/admin-list?page&limit&search&status&sortBy&sortOrder
       -> { data[], total, page, limit, totalPages }
       limit mặc định 20, trần 100. Mỗi phần tử có ipWhitelist.
       KHÔNG có bộ lọc theo IP.
```

### 8.2. Mã lỗi

| HTTP | businessCode | Khi nào |
|---|---|---|
| 400 | `INVALID_IP_FORMAT` | entry không có `/` và sai định dạng |
| 400 | `INVALID_CIDR_FORMAT` | entry có `/` và sai định dạng |
| 400 | — | `:id` không phải UUID, hoặc account không phải admin |
| 401 | — | token thiếu/sai/hết hạn |
| 403 | — | `REQUIRES_SUPER_ADMIN`, `IP_NOT_WHITELISTED`, hoặc sai role |
| 404 | — | account không tồn tại, hoặc entry không có trong list |
| 422 | `IP_WHITELIST_WOULD_LOCK_YOU_OUT` | kèm `clientIp` đã chuẩn hoá |

**Lỗi có HAI hình dạng** (chưa có global exception filter):
```jsonc
{ "message": "Invalid CIDR format: 1.2.3.4/33", "businessCode": "INVALID_CIDR_FORMAT" }
{ "message": "account not found", "error": "Not Found", "statusCode": 404 }
```
Loại thứ hai có `message` là **mảng** khi ValidationPipe từ chối.

### 8.3. Auth

Bearer token. Frontend giữ token trong cookie `httpOnly`, Route Handler đọc rồi gọi
NestJS. **Route Handler phải truyền `clientContext`** (`getClientContext()` trong
`frontend/lib/api/client-context.ts`) — thiếu thì backend thấy IP của server Next và
bất biến chống tự khoá so sai IP.

### 8.4. Đăng nhập (từ phiên trước)

```
POST /login/admin   chỉ admin, có IpWhitelistGuard, trả OTP challenge
POST /login         brand + creator dùng chung, TỪ CHỐI admin
```

---

## 9. Kiểm tra chất lượng

Chạy tại thời điểm bàn giao:

| Hạng mục | Lệnh | Kết quả |
|---|---|---|
| API typecheck | `npx tsc --noEmit -p tsconfig.json` | **PASS** (không output) |
| API lint | `npx eslint src` | **0 error, 1 warning** (`main.ts:64`) |
| API test | `npx jest` | **PASS** — 1 suite, 4 test |
| API build | `npx nest build` | **PASS** (exit 0) |
| FE typecheck | `npx tsc --noEmit` | **PASS** |
| FE lint | `npx eslint .` | **PASS** (không output) |
| FE test | `npx vitest run` | **PASS** — 2 file, 33 test |
| FE build | `next build` | **CHƯA CHẠY** trong phiên bàn giao |

**API test chỉ có 4 test** (`src/common/util/pg-error.util.spec.ts`). Các spec của
module social đã bị xoá ở phiên trước theo chủ ý của user.

---

## 10. Bước tiếp theo đề xuất

### Bước 1 — Commit phần super admin (làm ngay được)

```bash
cd /Users/admin/Code/CRM-KOC
git add api/src/module/admin/super-admin.guard.ts \
        api/migrations/1785899457382-add_admin_role.ts \
        api/src/module/admin/enum/admin-roles.enum.ts \
        api/src/module/admin/entities/admin_user.entity.ts \
        api/src/module/admin/admin.controller.ts \
        api/src/module/admin/admin.module.ts \
        api/scripts/create-superadmin.sql
git commit -m "feat(admin): SuperAdminGuard và phân cấp admin_role cho IP whitelist"
```
**Lý do làm trước:** migration đã chạy trên DB local nhưng file chưa track — máy khác
pull về sẽ lệch schema.

### Bước 2 — Commit phần gỡ `AdminSessionScope`

```bash
git add api/src/common/enum/admin-scopes.enum.ts \
        api/src/security/jwt-auth.service.ts \
        api/src/security/session.service.ts
git commit -m "refactor(security): gỡ AdminSessionScope không dùng khỏi phiên và JWT"
```

### Bước 3 — Kiểm tra 5 file modified chưa rõ nguồn gốc

`git diff` với `api/src/main.ts`, `api/src/module/auth/auth.controller.ts`,
`api/src/module/auth/dto/login.dto.ts`, `frontend/config/admin/navigation.ts`,
`frontend/lib/api/client.ts`. Quyết định commit hay revert.

### Bước 4 — Tiếp Task 4 của plan frontend

Đọc `frontend/docs/superpowers/plans/2026-08-05-admin-ip-whitelist-ui.md` mục Task 4.
Tạo `features/admin/ip-whitelist/types.ts` và Route Handler dưới `app/api/admin/`.
Nhớ truyền `clientContext`.

### Bước 5 — Task 5, 6, 7, 8 theo đúng thứ tự trong plan

Kết thúc bằng việc xoá `frontend/lib/mock/admin/ip-whitelist`.

### Bước 6 — Quyết định về `adminRole` trong `AdminResponseDto` (mục 5.4)

### Bước 7 — Xử lý nợ hạ tầng, ưu tiên cao nhất trước

`throttler-redis.storage.ts` chưa có try/catch — Redis chết là **toàn bộ API** trả
500, kể cả route không cần xác thực. Đây là thứ duy nhất trong danh sách nợ có thể
gây downtime toàn hệ thống.
