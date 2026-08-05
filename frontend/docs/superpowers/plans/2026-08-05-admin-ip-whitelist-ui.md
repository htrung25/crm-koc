# IP Whitelist UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nối trang `/admin/security` với backend thật để super admin sửa được IP whitelist của mình, admin thường chỉ xem.

**Architecture:** Next.js BFF. Server Component đọc trực tiếp qua `apiRequest` (có cookie); mọi mutation từ trình duyệt đi qua một Route Handler `/api/admin/me/ip-whitelist` tự resolve account id phía server. Logic thuần (validate, chuẩn hoá CIDR, đếm host, so khớp dải) tách ra `features/admin/ip-whitelist/whitelist.ts` và được test bằng Vitest.

**Tech Stack:** Next.js 16.2.10 (App Router, `proxy.ts` thay `middleware.ts`), React 19.2.4, TypeScript 5, Tailwind CSS 4, `@tanstack/react-query` 5.101.4 (mutation phía client), Vitest (thêm mới).

**Lệch có chủ đích khỏi skill dự án:** `.agents/skills/next-best-practices/route-handlers.md` khuyên dùng Server Action cho mutation từ UI. Plan này dùng Route Handler vì `lib/api/fetch-client.ts` đã có interceptor tự refresh token khi 401 (access token 15 phút) và cả 5 route auth hiện có đều theo mẫu này; Server Action không đi qua interceptor đó. Quyết định của người dùng, 2026-08-05.

Spec: `docs/superpowers/specs/2026-08-05-admin-ip-whitelist-ui-design.md`

## Global Constraints

- **Mọi `apiRequest` chạm tới whitelist BẮT BUỘC truyền `clientContext`** từ `getClientContext()`. Quên thì backend thấy IP của server Next, bất biến chống tự khoá vẫn chạy nhưng so sai IP — lá chắn trông như hoạt động trong khi đã vô hiệu.
- **Account id không bao giờ đến từ trình duyệt.** Route Handler tự resolve qua `GET /me`. Lý do: bất biến 422 chỉ áp khi `:id` là chính người gọi.
- **Sau mỗi PATCH/DELETE, set lại state từ `ipWhitelist` trong response.** Không tin chuỗi vừa gửi — backend đã chuẩn hoá và khử trùng lặp.
- **Chỉ IPv4.** Guard chỉ quy đổi `::1` và `::ffff:x.x.x.x`; entry IPv6 thuần không bao giờ khớp.
- **Rỗng = cho phép MỌI IP**, không phải chặn hết. Mọi chữ trên UI phải nói đúng chiều này.
- **CSV tối đa 2000 ký tự** (`@MaxLength(2000)` trên `UpdateAdminDto`).
- Toàn bộ chữ hiển thị bằng **tiếng Việt**.
- Không tự chạy dev server — người dùng tự chạy.

**Luật backend đã đối chiếu trực tiếp từ `api/src/module/admin/ip-whitelist.service.ts`:**

| Việc | Giá trị chính xác |
|---|---|
| Regex hình dạng | `^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$`, octet ≤ 255, prefix ≤ 32 |
| Chuẩn hoá CIDR | `` `${block.base}/${block.bitmask}` `` — host bits bị bỏ |
| Khử trùng lặp | **sau** khi chuẩn hoá |
| Lỗi IP | `Invalid IP address format: {entry}` + `businessCode: INVALID_IP_FORMAT` |
| Lỗi CIDR | `Invalid CIDR format: {entry}` + `businessCode: INVALID_CIDR_FORMAT` |
| 404 khi xoá | `IP/CIDR not in whitelist: {entry}` |
| 422 | `{ message, businessCode: "IP_WHITELIST_WOULD_LOCK_YOU_OUT", clientIp }`, `clientIp` **đã chuẩn hoá** |
| 403 super admin | `{ message: "REQUIRES_SUPER_ADMIN", error: "Forbidden", statusCode: 403 }` |
| `DELETE` chấp nhận entry chưa chuẩn hoá | gửi `10.0.0.5/24` xoá được `10.0.0.0/24` |

---

### Task 1: Vitest + logic thuần `whitelist.ts`

**Files:**
- Create: `vitest.config.ts`
- Create: `features/admin/ip-whitelist/whitelist.ts`
- Test: `features/admin/ip-whitelist/whitelist.test.ts`
- Modify: `package.json` (thêm devDeps + script `test`)

**Interfaces:**
- Consumes: (không có)
- Produces:
  - `parseWhitelist(raw?: string | null): string[]`
  - `serializeWhitelist(list: string[]): string`
  - `validateEntry(raw: string): string | null` — trả message lỗi tiếng Việt, `null` nghĩa là hợp lệ
  - `normalizeCidr(entry: string): string`
  - `hostCount(entry: string): number`
  - `entryCovers(entry: string, ip: string): boolean`
  - `MAX_WHITELIST_LENGTH: 2000`

- [ ] **Step 1: Cài Vitest**

```bash
npm install -D vitest@^3
```

- [ ] **Step 2: Thêm script `test` vào `package.json`**

Trong `"scripts"`, thêm dòng sau `"lint": "eslint"`:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Tạo `vitest.config.ts`**

Alias `@/` phải khai lại vì Vitest không đọc `paths` của tsconfig. `environment: "node"` là đủ — file này thuần, không chạm DOM.

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Viết test thất bại**

Tạo `features/admin/ip-whitelist/whitelist.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  entryCovers,
  hostCount,
  normalizeCidr,
  parseWhitelist,
  serializeWhitelist,
  validateEntry,
} from "@/features/admin/ip-whitelist/whitelist";

describe("parseWhitelist", () => {
  it("coi null và chuỗi rỗng là danh sách rỗng", () => {
    expect(parseWhitelist(null)).toEqual([]);
    expect(parseWhitelist("")).toEqual([]);
    expect(parseWhitelist(undefined)).toEqual([]);
  });

  it("bỏ khoảng trắng thừa và phần tử rỗng", () => {
    expect(parseWhitelist(" 1.2.3.4 , , 10.0.0.0/24 ")).toEqual([
      "1.2.3.4",
      "10.0.0.0/24",
    ]);
  });
});

describe("serializeWhitelist", () => {
  it("mảng rỗng thành chuỗi rỗng — backend đổi thành null = cho phép mọi IP", () => {
    expect(serializeWhitelist([])).toBe("");
  });

  it("khứ hồi giữ nguyên danh sách", () => {
    const list = ["1.2.3.4", "10.0.0.0/24"];
    expect(parseWhitelist(serializeWhitelist(list))).toEqual(list);
  });
});

describe("validateEntry", () => {
  it.each(["203.0.113.9", "10.0.0.0/24", "10.0.0.0/32", "0.0.0.0/0"])(
    "chấp nhận %s",
    (value) => {
      expect(validateEntry(value)).toBeNull();
    },
  );

  it.each([
    ["", "chuỗi rỗng"],
    ["10", "thiếu octet"],
    ["192.168.1", "thiếu octet"],
    ["256.1.1.1", "octet vượt 255"],
    ["1.2.3.4/33", "prefix vượt 32"],
    ["2001:db8::/32", "IPv6 thuần"],
    ["1.2.3.4/24/8", "hai dấu gạch chéo"],
  ])("từ chối %s (%s)", (value) => {
    expect(validateEntry(value)).toBeTypeOf("string");
  });
});

describe("normalizeCidr", () => {
  it("bỏ host bits đúng như backend lưu", () => {
    expect(normalizeCidr("10.0.0.5/24")).toBe("10.0.0.0/24");
    expect(normalizeCidr("192.168.1.130/25")).toBe("192.168.1.128/25");
  });

  it("giữ nguyên IP đơn", () => {
    expect(normalizeCidr("203.0.113.9")).toBe("203.0.113.9");
  });

  it("/0 gom về 0.0.0.0", () => {
    expect(normalizeCidr("10.0.0.5/0")).toBe("0.0.0.0/0");
  });
});

describe("hostCount", () => {
  it("IP đơn là 1 địa chỉ", () => {
    expect(hostCount("203.0.113.9")).toBe(1);
  });

  it("/24 là 256, /32 là 1, /0 là toàn bộ không gian IPv4", () => {
    expect(hostCount("10.0.0.0/24")).toBe(256);
    expect(hostCount("10.0.0.0/32")).toBe(1);
    expect(hostCount("0.0.0.0/0")).toBe(4294967296);
  });
});

describe("entryCovers", () => {
  it("/0 bao phủ mọi địa chỉ", () => {
    expect(entryCovers("0.0.0.0/0", "203.0.113.9")).toBe(true);
  });

  it("xét đúng biên của dải", () => {
    expect(entryCovers("10.0.0.0/24", "10.0.0.0")).toBe(true);
    expect(entryCovers("10.0.0.0/24", "10.0.0.255")).toBe(true);
    expect(entryCovers("10.0.0.0/24", "10.0.1.0")).toBe(false);
  });

  it("IP đơn chỉ khớp chính nó", () => {
    expect(entryCovers("1.2.3.4", "1.2.3.4")).toBe(true);
    expect(entryCovers("1.2.3.4", "1.2.3.5")).toBe(false);
  });

  it("khớp được cả khi entry chưa chuẩn hoá", () => {
    expect(entryCovers("10.0.0.5/24", "10.0.0.99")).toBe(true);
  });

  it("entry rác không bao phủ gì", () => {
    expect(entryCovers("linh tinh", "1.2.3.4")).toBe(false);
  });
});
```

- [ ] **Step 5: Chạy test để xác nhận nó fail**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "@/features/admin/ip-whitelist/whitelist"`

- [ ] **Step 6: Viết `features/admin/ip-whitelist/whitelist.ts`**

```ts
/**
 * Logic thuần cho IP whitelist — không React, không mạng.
 *
 * Luật ở đây phải khớp `api/src/module/admin/ip-whitelist.service.ts`. Nhưng
 * đây CHỈ là hàng rào báo lỗi sớm khi gõ, không phải lớp bảo vệ: backend luôn
 * validate lại và là nơi quyết định cuối cùng.
 */

/** Khớp @MaxLength(2000) trên UpdateAdminDto. */
export const MAX_WHITELIST_LENGTH = 2000;

const ENTRY_SHAPE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/;

export const parseWhitelist = (raw?: string | null): string[] =>
  (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Mảng rỗng -> "" -> backend set null -> cho phép mọi IP. */
export const serializeWhitelist = (list: string[]): string =>
  list
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");

/** Đổi IPv4 sang số 32-bit không dấu; null nếu không phải IPv4 hợp lệ. */
function toUint32(ip: string): number | null {
  const octets = ip.split(".");
  if (octets.length !== 4) return null;

  let result = 0;
  for (const octet of octets) {
    if (!/^\d{1,3}$/.test(octet)) return null;
    const part = Number(octet);
    if (part > 255) return null;
    result = result * 256 + part;
  }
  return result;
}

function toIpString(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

/** Mặt nạ /bits dạng số không dấu. `>>> 0` vì phép dịch của JS trả số có dấu. */
function maskOf(bits: number): number {
  return bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
}

/**
 * Báo lỗi tiếng Việt, hoặc null nếu hợp lệ.
 *
 * Cố tình KHÔNG nhận IPv6: guard của backend chỉ quy đổi `::1` và
 * `::ffff:x.x.x.x` rồi so bằng netmask (chỉ IPv4), nên một entry IPv6 thuần sẽ
 * lưu được nhưng không bao giờ khớp — im lặng và khó truy.
 */
export function validateEntry(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Nhập địa chỉ IP hoặc dải CIDR.";

  if (value.includes(":")) {
    return "Chỉ hỗ trợ IPv4. Địa chỉ IPv6 sẽ không bao giờ khớp.";
  }

  if (value.split("/").length > 2) {
    return "Sai định dạng: chỉ được có một dấu “/”.";
  }

  const match = value.match(ENTRY_SHAPE);
  if (!match) {
    return "IPv4 gồm 4 nhóm số, ví dụ 203.0.113.9 hoặc 203.0.113.0/24";
  }

  if (match.slice(1, 5).some((octet) => Number(octet) > 255)) {
    return "Mỗi nhóm phải là số từ 0 đến 255.";
  }

  if (match[5] !== undefined && Number(match[5]) > 32) {
    return "Độ dài dải CIDR phải từ 0 đến 32, ví dụ /24";
  }

  return null;
}

const isCidr = (entry: string): boolean => entry.includes("/");

/**
 * Bỏ host bits, đúng thứ backend thực sự lưu.
 * `10.0.0.5/24` -> `10.0.0.0/24`. Entry không hợp lệ trả về nguyên trạng.
 */
export function normalizeCidr(entry: string): string {
  if (!isCidr(entry)) return entry;

  const [ip, prefix] = entry.split("/");
  const base = toUint32(ip);
  const bits = Number(prefix);
  if (base === null || !Number.isInteger(bits) || bits < 0 || bits > 32) {
    return entry;
  }

  return `${toIpString((base & maskOf(bits)) >>> 0)}/${bits}`;
}

/** Số địa chỉ mà một entry bao phủ. IP đơn là 1. */
export function hostCount(entry: string): number {
  if (!isCidr(entry)) return 1;

  const bits = Number(entry.split("/")[1]);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return 1;

  return 2 ** (32 - bits);
}

/**
 * IP có được entry bao phủ không.
 *
 * Phải xét cả dải chứ không chỉ so bằng: 203.0.113.9 nằm trong 203.0.113.0/24,
 * so khớp chính xác sẽ báo "chưa có" và khiến người dùng thêm một mục vốn đã
 * được cho phép.
 */
export function entryCovers(entry: string, ip: string): boolean {
  const [network, prefix] = entry.split("/");
  const target = toUint32(ip);
  const base = toUint32(network);
  if (target === null || base === null) return false;

  if (prefix === undefined) return target === base;

  const bits = Number(prefix);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;

  const mask = maskOf(bits);
  return ((target & mask) >>> 0) === ((base & mask) >>> 0);
}
```

- [ ] **Step 7: Chạy test để xác nhận pass**

Run: `npm test`
Expected: PASS — toàn bộ describe block xanh.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts features/admin/ip-whitelist/
git commit -m "feat(admin): logic thuần cho IP whitelist + Vitest"
```

---

### Task 2: `ApiError` mang theo body lỗi

**Files:**
- Modify: `lib/api/client.ts:31-38` (class `ApiError`), và chỗ `throw new ApiError` ở cuối `apiRequest`
- Test: `lib/api/client.test.ts`

**Interfaces:**
- Consumes: (không có)
- Produces: `ApiError` với `body: unknown`, getter `businessCode: string | undefined`, getter `clientIp: string | undefined`

**Vì sao:** luồng 422 cần `body.clientIp`, highlight chip sai cần `businessCode`. Bản hiện tại vứt cả hai trước khi ném.

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/api/client.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/client";

describe("ApiError", () => {
  it("giữ nguyên message và status", () => {
    const error = new ApiError("hỏng", 400);
    expect(error.message).toBe("hỏng");
    expect(error.status).toBe(400);
    expect(error.body).toBeNull();
  });

  it("đọc được businessCode từ body lỗi nghiệp vụ", () => {
    const error = new ApiError("Invalid CIDR format: 1.2.3.4/33", 400, {
      message: "Invalid CIDR format: 1.2.3.4/33",
      businessCode: "INVALID_CIDR_FORMAT",
    });
    expect(error.businessCode).toBe("INVALID_CIDR_FORMAT");
  });

  it("đọc được clientIp từ body 422 tự khoá", () => {
    const error = new ApiError("would lock you out", 422, {
      businessCode: "IP_WHITELIST_WOULD_LOCK_YOU_OUT",
      clientIp: "203.0.113.9",
    });
    expect(error.clientIp).toBe("203.0.113.9");
  });

  it("body dạng Nest mặc định không có businessCode", () => {
    const error = new ApiError("account not found", 404, {
      message: "account not found",
      error: "Not Found",
      statusCode: 404,
    });
    expect(error.businessCode).toBeUndefined();
    expect(error.clientIp).toBeUndefined();
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `npm test -- lib/api/client.test.ts`
Expected: FAIL — `Property 'body' does not exist` / `error.businessCode` là `undefined` ở test thứ hai.

- [ ] **Step 3: Sửa `ApiError` trong `lib/api/client.ts`**

Thay nguyên class `ApiError` hiện tại bằng:

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /**
     * Body lỗi đã parse. Backend trả HAI hình dạng:
     *   { message, businessCode }                  <- lỗi nghiệp vụ
     *   { message, error, statusCode }             <- Nest mặc định
     * Giữ nguyên bản thô vì chỉ `message` + `status` là không đủ: dialog tự
     * khoá cần `clientIp`, và highlight chip sai cần `businessCode`.
     */
    public readonly body: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
  }

  private field(key: string): string | undefined {
    if (typeof this.body !== "object" || this.body === null) return undefined;
    const value = (this.body as Record<string, unknown>)[key];
    return typeof value === "string" ? value : undefined;
  }

  get businessCode(): string | undefined {
    return this.field("businessCode");
  }

  /** Có ở 422 IP_WHITELIST_WOULD_LOCK_YOU_OUT, đã chuẩn hoá về IPv4. */
  get clientIp(): string | undefined {
    return this.field("clientIp");
  }
}
```

- [ ] **Step 4: Truyền body vào chỗ ném lỗi**

Ở cuối `apiRequest`, đổi khối `if (!response.ok)` thành:

```ts
  if (!response.ok) {
    throw new ApiError(
      extractMessage(data, `Yêu cầu thất bại (${response.status})`),
      response.status,
      data,
    );
  }
```

- [ ] **Step 5: Chạy test**

Run: `npm test`
Expected: PASS — cả `whitelist.test.ts` lẫn `client.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add lib/api/client.ts lib/api/client.test.ts
git commit -m "feat(api): ApiError giữ businessCode và clientIp từ body lỗi"
```

---

### Task 3: Backend expose `adminRole`

**Files (repo `api/`, KHÔNG phải frontend):**
- Modify: `api/src/module/admin/dto/admin-response.dto.ts`
- Modify: `api/src/module/admin/admin.service.ts` (`toAdminResponse`, `findAdminById`)

**Interfaces:**
- Consumes: (không có)
- Produces: `AdminResponseDto.adminRole: 'admin' | 'super_admin'`

**Vì sao:** FE không có cách nào biết người đang xem là super admin. `GET /me` trả `accounts` row, `AdminResponseDto` và `AdminProfileResponseDto` đều không có `adminRole`. Không có field này thì FE chỉ phát hiện quyền bằng cách gửi request ghi rồi ăn 403 — trải nghiệm tệ.

**Nếu bỏ qua task này:** FE vẫn chạy được, `canEdit` luôn `false` (fail-safe chỉ-đọc). Task 8 xử lý fallback đó.

- [ ] **Step 1: Thêm field vào DTO**

Trong `api/src/module/admin/dto/admin-response.dto.ts`, thêm import và field vào `AdminResponseDto`:

```ts
import { EAdminRole } from '../enum/admin-roles.enum';
```

```ts
  /**
   * Phân cấp nội bộ giữa các admin. FE dùng field này để quyết định render
   * trình soạn thảo hay chế độ chỉ-đọc — nếu không có, nó phải thử ghi rồi
   * ăn 403 REQUIRES_SUPER_ADMIN mới biết.
   */
  @ApiProperty({ enum: EAdminRole, enumName: 'EAdminRole' })
  adminRole!: EAdminRole;
```

- [ ] **Step 2: Đưa `adminRole` vào response**

Trong `api/src/module/admin/admin.service.ts`, `getByAdminId` đã truy vấn `admin_users` rồi — nay cần thêm cả `adminRole`. Sửa `findAdminById` để đọc dòng `admin_users` một lần và dùng cho cả hai:

```ts
  async findAdminById(
    id: string,
  ): Promise<AuthenticatedAccount & { ipWhitelist: string | null; adminRole: EAdminRole }> {
    const account = await this.requireAdmin(id);
    const adminUser = await this.adminUserRepo.findOne({
      where: { accountId: id },
      select: { accountId: true, adminRole: true, ipWhitelist: true },
    });

    const entries = await this.ipWhitelistService.getByAdminId(id);
    return {
      ...this.toAdminResponse(account, entries),
      // Không có dòng admin_users => coi như admin thường, không phải super.
      adminRole: adminUser?.adminRole ?? EAdminRole.ADMIN,
    };
  }
```

Thêm import `EAdminRole` và bảo đảm `adminUserRepo` đã được inject trong `AdminService` (nếu chưa, inject `@InjectRepository(AdminUser)`).

- [ ] **Step 3: Kiểm chứng bằng swagger**

Người dùng chạy API rồi gọi:

```bash
curl -s -H "Authorization: Bearer <token>" http://localhost:3000/admin/<uuid> | jq '{adminRole, ipWhitelist}'
```

Expected: in ra `{"adminRole": "super_admin", "ipWhitelist": null}` (hoặc `"admin"` tuỳ tài khoản).

- [ ] **Step 4: Commit (trong repo api)**

```bash
cd ../api
git add src/module/admin/dto/admin-response.dto.ts src/module/admin/admin.service.ts
git commit -m "feat(admin): expose adminRole trong AdminResponseDto cho FE phân quyền UI"
```

---

### Task 4: Types + Route Handler `/api/admin/me/ip-whitelist`

**Files:**
- Create: `features/admin/ip-whitelist/types.ts`
- Create: `app/api/admin/me/ip-whitelist/route.ts`

**Interfaces:**
- Consumes: `ApiError` (Task 2), `MAX_WHITELIST_LENGTH` (Task 1)
- Produces:
  - `type AdminResponse` — `{ id, name, email, adminRole, ipWhitelist }` (các field khác backend vẫn trả, FE chỉ khai phần dùng tới)
  - `type WhitelistErrorBody = { message: string; businessCode?: string; clientIp?: string }`
  - Route `PATCH /api/admin/me/ip-whitelist` body `{ ipWhitelist: string; acknowledgeSelfLockout?: boolean }` → `AdminResponse`
  - Route `DELETE /api/admin/me/ip-whitelist?entry=…&acknowledgeSelfLockout=…` → `AdminResponse`

- [ ] **Step 1: Tạo `features/admin/ip-whitelist/types.ts`**

```ts
export type AdminRole = "admin" | "super_admin";

/**
 * Phần AdminResponseDto mà FE dùng tới. Backend còn trả phone/status/
 * createdAt… nhưng khai thừa chỉ tạo ràng buộc giả với những field không ai đọc.
 */
export type AdminResponse = {
  id: string;
  name: string;
  email: string;
  adminRole?: AdminRole;
  /** CSV; null hoặc rỗng = KHÔNG giới hạn IP. */
  ipWhitelist: string | null;
};

/** Body lỗi, gộp cả hai hình dạng backend trả về. */
export type WhitelistErrorBody = {
  message: string;
  businessCode?: string;
  clientIp?: string;
};

export const LOCKOUT_CODE = "IP_WHITELIST_WOULD_LOCK_YOU_OUT";
export const SUPER_ADMIN_REQUIRED = "REQUIRES_SUPER_ADMIN";
```

- [ ] **Step 2: Tạo `app/api/admin/me/ip-whitelist/route.ts`**

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/client";
import { getClientContext, type ClientContext } from "@/lib/api/client-context";
import { ACCESS_COOKIE } from "@/features/auth/session";
import { MAX_WHITELIST_LENGTH } from "@/features/admin/ip-whitelist/whitelist";
import type {
  AdminResponse,
  WhitelistErrorBody,
} from "@/features/admin/ip-whitelist/types";

/**
 * Sửa whitelist của CHÍNH người đang đăng nhập.
 *
 * Đường dẫn cố ý là '/me' chứ không phải '/[id]': bất biến chống tự khoá của
 * backend CHỈ áp khi ':id' là chính người gọi. Nếu trình duyệt truyền được id,
 * nó gửi được id của admin khác — request vẫn hợp lệ nhưng lá chắn tắt lặng lẽ.
 * Resolve id ở server thì id không bao giờ đi qua trình duyệt.
 */

type Session = {
  token: string;
  adminId: string;
  clientContext: ClientContext;
};

async function resolveSession(): Promise<Session | NextResponse> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Phiên đã kết thúc" }, { status: 401 });
  }

  // clientContext phải đi kèm MỌI lời gọi: thiếu nó backend thấy IP của server
  // Next, bất biến chống tự khoá vẫn chạy nhưng so sai IP.
  const clientContext = await getClientContext();

  try {
    const me = await apiRequest<{ id: string }>("/me", {
      token,
      clientContext,
    });
    return { token, adminId: me.id, clientContext };
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown): NextResponse {
  if (!(error instanceof ApiError)) throw error;

  const body: WhitelistErrorBody = { message: error.message };
  if (error.businessCode) body.businessCode = error.businessCode;
  if (error.clientIp) body.clientIp = error.clientIp;

  return NextResponse.json(body, { status: error.status });
}

export async function PATCH(request: Request) {
  const session = await resolveSession();
  if (session instanceof NextResponse) return session;

  let payload: { ipWhitelist?: unknown; acknowledgeSelfLockout?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Body không hợp lệ" }, { status: 400 });
  }

  // Chuỗi rỗng là giá trị HỢP LỆ (= cho phép mọi IP), nên phải kiểm kiểu chứ
  // không kiểm truthy.
  if (typeof payload.ipWhitelist !== "string") {
    return NextResponse.json(
      { message: "Thiếu trường ipWhitelist" },
      { status: 400 },
    );
  }

  if (payload.ipWhitelist.length > MAX_WHITELIST_LENGTH) {
    return NextResponse.json(
      { message: `Danh sách vượt quá ${MAX_WHITELIST_LENGTH} ký tự` },
      { status: 400 },
    );
  }

  try {
    const result = await apiRequest<AdminResponse>(`/admin/${session.adminId}`, {
      method: "PATCH",
      body: {
        ipWhitelist: payload.ipWhitelist,
        acknowledgeSelfLockout: payload.acknowledgeSelfLockout === true,
      },
      token: session.token,
      clientContext: session.clientContext,
    });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const session = await resolveSession();
  if (session instanceof NextResponse) return session;

  const params = new URL(request.url).searchParams;
  const entry = params.get("entry")?.trim();
  if (!entry) {
    return NextResponse.json({ message: "Thiếu tham số entry" }, { status: 400 });
  }

  // encodeURIComponent vì CIDR chứa dấu '/'.
  const query = new URLSearchParams({
    entry,
    acknowledgeSelfLockout: String(
      params.get("acknowledgeSelfLockout") === "true",
    ),
  });

  try {
    const result = await apiRequest<AdminResponse>(
      `/admin/${session.adminId}/ip-whitelist?${query}`,
      {
        method: "DELETE",
        token: session.token,
        clientContext: session.clientContext,
      },
    );
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 4: Commit**

```bash
git add features/admin/ip-whitelist/types.ts app/api/admin/me/ip-whitelist/route.ts
git commit -m "feat(admin): route handler sửa IP whitelist của chính mình"
```

---

### Task 5: `QueryClientProvider` + hook `useIpWhitelist`

**Files:**
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx` (bọc `children` bằng `<Providers>`)
- Create: `features/admin/ip-whitelist/use-ip-whitelist.ts`

**Interfaces:**
- Consumes: `parseWhitelist`, `serializeWhitelist`, `validateEntry`, `MAX_WHITELIST_LENGTH` (Task 1); `AdminResponse`, `WhitelistErrorBody`, `LOCKOUT_CODE` (Task 4); `apiFetch` (`lib/api/fetch-client.ts`, đã có sẵn)
- Produces:

```ts
type Lockout = { clientIp: string };

useIpWhitelist(initialWhitelist: string | null): {
  entries: string[];
  pending: boolean;
  error: string | null;
  lockout: Lockout | null;
  addEntry: (raw: string) => void;
  removeEntry: (entry: string) => void;
  clearAll: () => void;
  forceLastAction: () => void;   // gửi lại thao tác vừa rồi với acknowledgeSelfLockout: true
  dismissLockout: () => void;
  clearError: () => void;
}
```

**Ghi chú kiến trúc (khác plan gốc):** repo đã cài `@tanstack/react-query@5.101.4` nên task này dùng `useMutation` thay cho `useState` tự chế. Mutation vẫn gọi tới Route Handler ở Task 4 — **cố ý lệch** khỏi `.agents/skills/next-best-practices/route-handlers.md` (skill khuyên dùng Server Action cho mutation từ UI). Lý do: 5 route auth hiện có đều là Route Handler, và `lib/api/fetch-client.ts` đã có interceptor tự gọi `/api/auth/refresh` khi gặp 401 — access token sống 15 phút nên 401 xảy ra thường xuyên; Server Action không đi qua interceptor đó.

- [ ] **Step 1: Tạo `app/providers.tsx`**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * QueryClient phải tạo trong `useState`, KHÔNG phải ở cấp module.
 *
 * Một instance ở cấp module bị chia sẻ giữa mọi request khi render phía server
 * — dữ liệu của người dùng này rò sang người dùng khác. `useState` với hàm
 * khởi tạo cho mỗi cây React một client riêng.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
          // Mutation KHÔNG được tự thử lại: PATCH bị 422 mà retry là bỏ qua
          // cảnh báo tự khoá, còn DELETE thử lại lần hai sẽ ăn 404 vì phần tử
          // đã bị xoá ở lần đầu.
          mutations: { retry: false },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 2: Bọc root layout**

Trong `app/layout.tsx`, thêm import và bọc `children`:

```tsx
import { Providers } from "./providers";
```

```tsx
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
```

Giữ nguyên mọi thứ khác trong file (`metadata`, `lang="vi"`, các className).

- [ ] **Step 3: Viết hook**

```ts
"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/fetch-client";
import {
  MAX_WHITELIST_LENGTH,
  parseWhitelist,
  serializeWhitelist,
  validateEntry,
} from "./whitelist";
import {
  LOCKOUT_CODE,
  type AdminResponse,
  type WhitelistErrorBody,
} from "./types";

const ENDPOINT = "/api/admin/me/ip-whitelist";

export type Lockout = { clientIp: string };

/** Ghi đè cả danh sách, hoặc xoá đúng một phần tử. */
type Operation =
  | { kind: "replace"; list: string[] }
  | { kind: "remove"; entry: string };

type Variables = { operation: Operation; acknowledge: boolean };

/** Giữ lại status + body để `onError` phân nhánh được. */
class WhitelistRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly businessCode?: string,
    readonly clientIp?: string,
  ) {
    super(message);
    this.name = "WhitelistRequestError";
  }
}

async function send({ operation, acknowledge }: Variables): Promise<AdminResponse> {
  const response =
    operation.kind === "replace"
      ? await apiFetch(ENDPOINT, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ipWhitelist: serializeWhitelist(operation.list),
            acknowledgeSelfLockout: acknowledge,
          }),
        })
      : // encodeURIComponent vì CIDR chứa dấu '/'.
        await apiFetch(
          `${ENDPOINT}?entry=${encodeURIComponent(operation.entry)}&acknowledgeSelfLockout=${acknowledge}`,
          { method: "DELETE" },
        );

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const failure = (body ?? {}) as WhitelistErrorBody;
    throw new WhitelistRequestError(
      failure.message || "Không lưu được thay đổi.",
      response.status,
      failure.businessCode,
      failure.clientIp,
    );
  }

  return body as AdminResponse;
}

/**
 * State chip-list + ba thao tác ghi.
 *
 * Mỗi thao tác lưu ngay, không có nút "Lưu" nên không có trạng thái chưa lưu
 * để mất khi đóng tab. Sau mỗi lần thành công, state được set lại từ
 * `ipWhitelist` trong response — KHÔNG tin chuỗi vừa gửi, vì backend đã chuẩn
 * hoá (10.0.0.5/24 -> 10.0.0.0/24) và khử trùng lặp.
 */
export function useIpWhitelist(initialWhitelist: string | null) {
  const [entries, setEntries] = useState(() => parseWhitelist(initialWhitelist));
  const [error, setError] = useState<string | null>(null);
  const [lockout, setLockout] = useState<Lockout | null>(null);
  // Giữ lại thao tác vừa bị 422 để nút "Vẫn lưu" gửi lại đúng nó.
  const [lastVariables, setLastVariables] = useState<Variables | null>(null);

  const mutation = useMutation({
    mutationFn: send,
    onMutate: () => {
      setError(null);
    },
    onSuccess: (data) => {
      setLockout(null);
      setLastVariables(null);
      setEntries(parseWhitelist(data.ipWhitelist));
    },
    onError: (failure, variables) => {
      if (!(failure instanceof WhitelistRequestError)) {
        setError("Không kết nối được tới máy chủ. Vui lòng thử lại.");
        return;
      }

      if (
        failure.status === 422 &&
        failure.businessCode === LOCKOUT_CODE &&
        failure.clientIp
      ) {
        setLastVariables(variables);
        setLockout({ clientIp: failure.clientIp });
        return;
      }

      // apiFetch đã tự thử refresh một lần; còn 401 nghĩa là phiên đã chết.
      if (failure.status === 401) {
        window.location.href = "/admin";
        return;
      }

      setError(failure.message);
    },
  });

  const { mutate } = mutation;

  const replace = useCallback(
    (list: string[]) => {
      if (serializeWhitelist(list).length > MAX_WHITELIST_LENGTH) {
        setError(`Danh sách vượt quá ${MAX_WHITELIST_LENGTH} ký tự.`);
        return;
      }
      mutate({ operation: { kind: "replace", list }, acknowledge: false });
    },
    [mutate],
  );

  const addEntry = useCallback(
    (raw: string) => {
      const value = raw.trim();
      const message = validateEntry(value);
      if (message) {
        setError(message);
        return;
      }
      // Ghi đè là ngữ nghĩa duy nhất backend có — thêm một mục vẫn gửi cả danh sách.
      replace([...entries, value]);
    },
    [entries, replace],
  );

  /**
   * Xoá bằng DELETE chứ không PATCH cả chuỗi: server đọc-sửa-ghi trên giá trị
   * mới nhất nên không đụng mục mà tab khác vừa thêm.
   */
  const removeEntry = useCallback(
    (entry: string) => {
      mutate({ operation: { kind: "remove", entry }, acknowledge: false });
    },
    [mutate],
  );

  /** Chuỗi rỗng -> backend set null -> CHO PHÉP MỌI IP. */
  const clearAll = useCallback(() => replace([]), [replace]);

  const forceLastAction = useCallback(() => {
    if (lastVariables) mutate({ ...lastVariables, acknowledge: true });
  }, [lastVariables, mutate]);

  return {
    entries,
    pending: mutation.isPending,
    error,
    lockout,
    addEntry,
    removeEntry,
    clearAll,
    forceLastAction,
    dismissLockout: useCallback(() => setLockout(null), []),
    clearError: useCallback(() => setError(null), []),
  };
}
```

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint app/providers.tsx app/layout.tsx features/admin/ip-whitelist/`
Expected: không lỗi, không cảnh báo biến không dùng.

- [ ] **Step 5: Commit**

```bash
git add app/providers.tsx app/layout.tsx features/admin/ip-whitelist/use-ip-whitelist.ts
git commit -m "feat(admin): QueryClientProvider + hook useIpWhitelist dùng react-query"
```

---

### Task 6: `SelfLockoutDialog`

**Files:**
- Create: `components/admin/self-lockout-dialog.tsx`

**Interfaces:**
- Consumes: (không có)
- Produces: `<SelfLockoutDialog clientIp onAddCurrentIp onForce onDismiss />`
  - `clientIp: string`, `onAddCurrentIp: () => void`, `onForce: () => void`, `onDismiss: () => void`

- [ ] **Step 1: Viết component**

```tsx
"use client";

import { useId, useState } from "react";

type SelfLockoutDialogProps = {
  /** IP backend thấy, ĐÃ chuẩn hoá (127.0.0.1 chứ không phải ::ffff:127.0.0.1). */
  clientIp: string;
  onAddCurrentIp: () => void;
  onForce: () => void;
  onDismiss: () => void;
};

/**
 * Hiện khi backend trả 422 IP_WHITELIST_WOULD_LOCK_YOU_OUT.
 *
 * Nút an toàn là nút CHÍNH. Lối thoát `acknowledgeSelfLockout` nằm sau một ô
 * tick không bao giờ được set sẵn — nó có thật vì có trường hợp hợp lệ (sắp
 * đổi mạng, sắp bật VPN), nhưng mỗi lần dùng backend ghi log cảnh báo.
 */
export function SelfLockoutDialog({
  clientIp,
  onAddCurrentIp,
  onForce,
  onDismiss,
}: SelfLockoutDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const titleId = useId();
  const checkboxId = useId();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-[26px] bg-white p-6 shadow-2xl"
      >
        <h2 id={titleId} className="text-lg font-extrabold text-[#2D3B42]">
          Thay đổi này sẽ khoá bạn ra ngoài
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#5C5049]">
          IP hiện tại của bạn là{" "}
          <code className="font-mono font-bold text-[#2D3B42]">{clientIp}</code>,
          và nó không nằm trong danh sách mới. Nếu lưu, bạn sẽ mất quyền vào khu
          vực quản trị ngay ở request kế tiếp.
        </p>

        <p className="mt-3 rounded-2xl bg-amber-500/12 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-800">
          Không có đường tự cứu. Đăng nhập lại cũng vô ích. Bạn sẽ phải nhờ một
          super admin khác sửa hộ, hoặc sửa thẳng dưới cơ sở dữ liệu.
        </p>

        <button
          type="button"
          onClick={onAddCurrentIp}
          className="mt-5 w-full rounded-2xl bg-[#EF4623] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#EF4623]/30 transition-colors hover:bg-[#D83B19] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30"
        >
          Thêm {clientIp} vào danh sách rồi lưu
        </button>

        <div className="mt-5 border-t border-[#2D3B42]/10 pt-4">
          <label
            htmlFor={checkboxId}
            className="flex items-start gap-2.5 text-xs font-semibold text-[#5C5049]"
          >
            <input
              id={checkboxId}
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#EF4623]"
            />
            Tôi hiểu mình có thể mất quyền truy cập
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!acknowledged}
              onClick={onForce}
              className="rounded-full border border-[#EF4623]/40 px-4 py-2 text-xs font-bold text-[#EF4623] transition-colors hover:bg-[#EF4623]/10 disabled:cursor-not-allowed disabled:border-[#2D3B42]/15 disabled:text-[#8A7768] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30"
            >
              Vẫn lưu, tôi chấp nhận
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full px-4 py-2 text-xs font-bold text-[#5C5049] transition-colors hover:bg-[#2D3B42]/8 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D3B42]/20"
            >
              Huỷ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 3: Commit**

```bash
git add components/admin/self-lockout-dialog.tsx
git commit -m "feat(admin): dialog cảnh báo tự khoá khi sửa IP whitelist"
```

---

### Task 7: Viết lại `IpWhitelistManager`

**Files:**
- Modify (viết lại toàn bộ): `components/admin/ip-whitelist-manager.tsx`

**Interfaces:**
- Consumes: `useIpWhitelist` (Task 5), `SelfLockoutDialog` (Task 6), `entryCovers`/`hostCount`/`normalizeCidr`/`validateEntry` (Task 1)
- Produces: `<IpWhitelistManager initialWhitelist currentIp canEdit />`
  - `initialWhitelist: string | null`, `currentIp: string | null`, `canEdit: boolean`

**Thay đổi so với bản cũ:** bỏ cột Ghi chú và Ngày thêm (backend không có chỗ lưu), bảng đổi thành chip-list, thêm badge "Không giới hạn IP", thêm chế độ chỉ-đọc, và logic thuần nay import từ `whitelist.ts` thay vì định nghĩa tại chỗ.

- [ ] **Step 1: Viết lại file**

```tsx
"use client";

import { useId, useRef, useState } from "react";

import { IconPlus, IconShield, IconTrash } from "@/components/ui/icons";
import { SelfLockoutDialog } from "@/components/admin/self-lockout-dialog";
import { useIpWhitelist } from "@/features/admin/ip-whitelist/use-ip-whitelist";
import {
  entryCovers,
  hostCount,
  normalizeCidr,
  validateEntry,
} from "@/features/admin/ip-whitelist/whitelist";

type IpWhitelistManagerProps = {
  /** CSV từ backend. null = KHÔNG giới hạn IP. */
  initialWhitelist: string | null;
  /** IP mà server thấy ở request hiện tại. */
  currentIp: string | null;
  /** Chỉ super admin mới sửa được (backend gác bằng SuperAdminGuard). */
  canEdit: boolean;
};

const formatCount = (n: number) => n.toLocaleString("vi-VN");

export function IpWhitelistManager({
  initialWhitelist,
  currentIp,
  canEdit,
}: IpWhitelistManagerProps) {
  const {
    entries,
    pending,
    error,
    lockout,
    addEntry,
    removeEntry,
    clearAll,
    forceLastAction,
    dismissLockout,
    clearError,
  } = useIpWhitelist(initialWhitelist);

  const [value, setValue] = useState("");
  const [confirmingClear, setConfirmingClear] = useState(false);
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const unrestricted = entries.length === 0;
  const coveringEntry =
    currentIp === null
      ? undefined
      : entries.find((entry) => entryCovers(entry, currentIp));

  // Cảnh báo (không chặn) khi CIDR có host bits khác 0 — backend sẽ lưu khác
  // thứ vừa gõ, và người dùng nên biết TRƯỚC chứ không phải sau khi lưu.
  const draft = value.trim();
  const normalizedDraft =
    draft && validateEntry(draft) === null ? normalizeCidr(draft) : null;
  const willNormalize = normalizedDraft !== null && normalizedDraft !== draft;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEntry(value);
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <section className="rounded-[26px] glass p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#EF4623]/12 text-[#EF4623]">
            <IconShield className="h-[19px] w-[19px]" />
          </span>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-[#2D3B42]">
              Danh sách IP được phép
            </h2>
            <p className="text-xs font-medium text-[#8A7768]">
              Kiểm soát địa chỉ được phép vào khu vực quản trị
            </p>
          </div>
        </div>

        {unrestricted ? (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-800">
            Không giới hạn IP
          </span>
        ) : (
          <span className="rounded-full bg-[#2D3B42]/8 px-2.5 py-1 font-mono text-[11px] font-bold text-[#2D3B42] tnum">
            {entries.length} mục
          </span>
        )}
      </div>

      {unrestricted && (
        <p className="mt-4 rounded-2xl bg-amber-500/12 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-800">
          Danh sách đang trống nên <strong>mọi địa chỉ đều truy cập được</strong>.
          Đây là mặc định, không phải lỗi. Thêm ít nhất một mục để bật lớp bảo vệ.
        </p>
      )}

      {!canEdit && (
        <p className="mt-4 rounded-2xl bg-[#2D3B42]/8 px-4 py-3 text-xs font-semibold text-[#5C5049]">
          Chỉ super admin mới thay đổi được danh sách này. Bạn đang ở chế độ xem.
        </p>
      )}

      {currentIp && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/60 px-4 py-3">
          <span className="text-xs font-semibold text-[#5C5049]">
            IP của bạn hiện tại:
          </span>
          <code className="font-mono text-xs font-bold text-[#2D3B42] tnum">
            {currentIp}
          </code>
          {coveringEntry ? (
            <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              Được cho phép qua <code className="font-mono">{coveringEntry}</code>
            </span>
          ) : (
            // Không gác theo `unrestricted`: danh sách rỗng chính là lúc người
            // dùng cần thêm IP của mình nhất — bật whitelist mà quên chính mình
            // là cách tự khoá phổ biến nhất.
            canEdit && (
              <button
                type="button"
                onClick={() => {
                  setValue(currentIp);
                  clearError();
                  inputRef.current?.focus();
                }}
                className="rounded-full bg-[#EF4623]/12 px-2.5 py-1 text-[11px] font-bold text-[#EF4623] transition-colors hover:bg-[#EF4623]/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30"
              >
                Điền vào ô thêm mới
              </button>
            )
          )}
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-wrap gap-3">
          <div className="min-w-[240px] flex-1">
            <label
              htmlFor={inputId}
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
            >
              IP hoặc dải CIDR
            </label>
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) clearError();
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              placeholder="203.0.113.9 hoặc 203.0.113.0/24…"
              className="mt-1.5 w-full rounded-2xl border border-[#2D3B42]/15 bg-[#FDF1EE]/50 px-4 py-3 font-mono text-sm text-[#2D3B42] tnum transition-all duration-300 placeholder:font-sans placeholder:text-slate-400 focus:border-[#EF4623] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EF4623]/20"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-[26px] flex h-[50px] items-center gap-2 rounded-2xl bg-[#EF4623] px-5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#EF4623]/30 transition-all duration-300 hover:bg-[#D83B19] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30"
          >
            <IconPlus className="h-4 w-4" />
            {pending ? "Đang lưu…" : "Thêm"}
          </button>
        </form>
      )}

      {willNormalize && (
        <p className="mt-2 text-xs font-semibold text-amber-700">
          {draft} sẽ được lưu thành {normalizedDraft}, tức toàn bộ{" "}
          {formatCount(hostCount(draft))} địa chỉ.
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-xs font-semibold text-[#EF4623]"
        >
          {error}
        </p>
      )}

      <ul className="mt-5 flex flex-wrap gap-2">
        {entries.map((entry) => {
          const isCurrent =
            currentIp !== null && entryCovers(entry, currentIp);
          const count = hostCount(entry);

          return (
            <li
              key={entry}
              className={`flex items-center gap-2 rounded-full py-1.5 pl-3.5 pr-1.5 ${
                isCurrent
                  ? "bg-emerald-500/12 text-emerald-800"
                  : "bg-white/70 text-[#2D3B42]"
              }`}
            >
              <code className="font-mono text-sm font-bold tnum">{entry}</code>
              {count > 1 && (
                <span className="text-[11px] font-semibold opacity-70">
                  {formatCount(count)} IP
                </span>
              )}
              {isCurrent && (
                <span className="text-[11px] font-bold">· IP của bạn</span>
              )}
              {canEdit && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeEntry(entry)}
                  aria-label={`Gỡ ${entry} khỏi danh sách`}
                  className="grid h-7 w-7 place-items-center rounded-full text-current opacity-60 transition-opacity hover:opacity-100 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {canEdit && !unrestricted && (
        <div className="mt-5 border-t border-[#2D3B42]/10 pt-4">
          {confirmingClear ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#5C5049]">
                Xoá hết sẽ khiến <strong>mọi địa chỉ IP truy cập được</strong>,
                không phải chặn tất cả. Tiếp tục?
              </span>
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setConfirmingClear(false);
                }}
                className="rounded-full bg-[#EF4623] px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-[#D83B19]"
              >
                Xoá toàn bộ
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="rounded-full px-3 py-1 text-[11px] font-bold text-[#5C5049] transition-colors hover:bg-white/70"
              >
                Huỷ
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingClear(true)}
              className="text-[11px] font-bold text-[#8A7768] underline-offset-4 transition-colors hover:text-[#EF4623] hover:underline"
            >
              Xoá toàn bộ danh sách
            </button>
          )}
        </div>
      )}

      <p className="mt-4 border-t border-[#2D3B42]/10 pt-4 text-[11px] leading-relaxed text-[#8A7768]">
        Danh sách trống nghĩa là cho phép mọi IP. Backend sẽ chuẩn hoá giá trị
        khi lưu — <code className="font-mono">10.0.0.5/24</code> thành{" "}
        <code className="font-mono">10.0.0.0/24</code> — nên thứ hiển thị sau khi
        lưu có thể khác thứ vừa gõ.
      </p>

      {lockout && (
        <SelfLockoutDialog
          clientIp={lockout.clientIp}
          onAddCurrentIp={() => {
            dismissLockout();
            addEntry(lockout.clientIp);
          }}
          onForce={forceLastAction}
          onDismiss={dismissLockout}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint components/admin/ip-whitelist-manager.tsx`
Expected: không lỗi.

- [ ] **Step 3: Commit**

```bash
git add components/admin/ip-whitelist-manager.tsx
git commit -m "feat(admin): chip-list IP whitelist nối API thật, có chế độ chỉ-đọc"
```

---

### Task 8: Nối trang `/admin/security` và xoá mock

**Files:**
- Modify: `app/admin/(dashboard)/security/page.tsx`
- Delete: `lib/mock/admin/ip-whitelist.ts`

**Interfaces:**
- Consumes: `IpWhitelistManager` (Task 7), `AdminResponse` (Task 4), `apiRequest`/`ApiError` (Task 2), `getClientContext`/`clientIpOf` (đã có)
- Produces: trang hoàn chỉnh

- [ ] **Step 1: Viết lại page**

```tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { IpWhitelistManager } from "@/components/admin/ip-whitelist-manager";
import { ACCESS_COOKIE } from "@/features/auth/session";
import type { AdminResponse } from "@/features/admin/ip-whitelist/types";
import { ApiError, apiRequest } from "@/lib/api/client";
import { clientIpOf, getClientContext } from "@/lib/api/client-context";

export const metadata: Metadata = {
  title: "Bảo mật",
};

export default async function AdminSecurityPage() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;

  // Cùng nguồn IP mà route đăng nhập chuyển tiếp cho backend, nên con số hiển
  // thị ở đây đúng bằng thứ IpWhitelistGuard sẽ đem đi so khớp.
  const clientContext = await getClientContext();
  const currentIp = clientIpOf(clientContext);

  if (!token) redirect("/admin");

  let admin: AdminResponse;
  try {
    const me = await apiRequest<{ id: string }>("/me", { token, clientContext });
    admin = await apiRequest<AdminResponse>(`/admin/${me.id}`, {
      token,
      clientContext,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/admin");
    throw error;
  }

  // Fail-safe: thiếu adminRole (backend chưa expose) thì coi như không có
  // quyền sửa. Thà super admin phải hỏi vì sao không sửa được, còn hơn admin
  // thường bấm nút rồi ăn 403 khó hiểu.
  const canEdit = admin.adminRole === "super_admin";

  return (
    <>
      <AdminTopbar
        title="Bảo mật"
        greeting="Kiểm soát địa chỉ được phép truy cập khu vực quản trị."
      />

      <AdminMobileNav />

      <IpWhitelistManager
        initialWhitelist={admin.ipWhitelist}
        currentIp={currentIp}
        canEdit={canEdit}
      />
    </>
  );
}
```

- [ ] **Step 2: Xoá file mock**

```bash
git rm lib/mock/admin/ip-whitelist.ts
```

- [ ] **Step 3: Xác nhận không còn ai import mock**

Run: `grep -rn "mock/admin/ip-whitelist" --include="*.ts" --include="*.tsx" app components features lib`
Expected: không có kết quả.

- [ ] **Step 4: Chạy toàn bộ kiểm chứng**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: test PASS, không lỗi type, build thành công.

- [ ] **Step 5: Commit**

```bash
git add app/admin/\(dashboard\)/security/page.tsx lib/mock/
git commit -m "feat(admin): trang bảo mật dùng IP whitelist thật, bỏ mock"
```

- [ ] **Step 6: Kiểm chứng thủ công (người dùng chạy)**

Người dùng chạy `npm run dev` (frontend) và API NestJS, rồi vào `/admin/security` với tài khoản super admin:

1. Danh sách trống → thấy badge "Không giới hạn IP" và cảnh báo màu vàng nói rõ *mọi địa chỉ đều truy cập được*.
2. Gõ `10.0.0.5/24` → thấy cảnh báo *"sẽ được lưu thành 10.0.0.0/24, tức toàn bộ 256 địa chỉ"* trước khi bấm Thêm.
3. Bấm Thêm → chip hiện ra là `10.0.0.0/24 · 256 IP` (đã chuẩn hoá), **reload trang vẫn còn**.
4. Thêm một dải không chứa IP của mình → dialog tự khoá hiện ra, nút "Vẫn lưu" bị khoá cho tới khi tick.
5. Bấm "Thêm {IP} vào danh sách rồi lưu" → lưu được, chip mới có nhãn "IP của bạn".
6. Bấm X trên một chip → biến mất ngay, reload vẫn mất.
7. Đăng nhập bằng tài khoản `adminRole = 'admin'` → không có ô nhập, không có nút X, có dòng "Chỉ super admin mới thay đổi được danh sách này."

---

## Self-Review

**Spec coverage:**

| Mục spec | Task |
|---|---|
| §4.1 id từ `GET /me` | Task 4 (`resolveSession`), Task 8 (page) |
| §4.2 route `/me` không nhận id từ client | Task 4 |
| §4.3 `ApiError` mang body | Task 2 |
| §4.4 bỏ note/addedAt, chip-list | Task 7 |
| §4.5 lưu ngay, PATCH/DELETE/clear | Task 5 |
| §4.6 phân quyền + blocker `adminRole` | Task 3 (BE), Task 7 (`canEdit`), Task 8 (fail-safe) |
| §5 clientContext ở mọi lời gọi | Task 4, Task 8 |
| §6 validate client + cảnh báo host bits + 2000 ký tự | Task 1, Task 5, Task 7 |
| §7 bảng lỗi (401/403/404/422) | Task 5 (`submit`), Task 4 (`toErrorResponse`) |
| §8 dialog tự khoá | Task 6 |
| §9 ba điều UI phải nói rõ | Task 7 (badge, cảnh báo xoá hết, ghi chú chuẩn hoá) |
| §10 Vitest + build | Task 1, Task 8 |

**Còn thiếu có chủ đích:** refetch trước khi mở form (§4.5 note) — trang là Server Component với `cache: "no-store"` nên mỗi lần vào đã là dữ liệu mới; không cần bước riêng.

**Type consistency:** `AdminResponse.ipWhitelist: string | null` dùng thống nhất ở Task 4/5/7/8. `adminRole` optional ở FE (`adminRole?: AdminRole`) vì Task 3 có thể chưa làm — Task 8 so `=== "super_admin"` nên `undefined` cho ra `false`, đúng hướng fail-safe.
