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

/**
 * Quy IP nguồn về IPv4, phản chiếu đúng `normalizeIp` của backend
 * (api/src/module/admin/ip-whitelist.service.ts).
 *
 * BẮT BUỘC phải khớp, vì đây là giá trị guard thật sự đem đi so với whitelist.
 * Hiển thị `::1` trong khi guard so `127.0.0.1` gây ba hậu quả cùng lúc: nút
 * "điền IP của tôi" điền một chuỗi mà chính validate của ta từ chối (chỉ
 * IPv4), badge "IP của bạn" không bao giờ sáng dù `127.0.0.1` đã nằm trong
 * danh sách, và con số trên màn hình nói dối về thứ đang được so khớp.
 */
export function normalizeClientIp(ip: string | null): string | null {
  if (!ip) return null;
  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}

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
 * Cố tình KHÔNG nhận IPv6: guard của backend chỉ quy đổi `::1` và
 * `::ffff:x.x.x.x` rồi so bằng netmask (chỉ IPv4), nên một entry IPv6 thuần sẽ
 * lưu được nhưng không bao giờ khớp — im lặng và khó truy.
 */
export type EntryError =
  | "EMPTY"
  | "IPV6_NOT_SUPPORTED"
  | "MULTIPLE_SLASHES"
  | "INVALID_SHAPE"
  | "OCTET_OUT_OF_RANGE"
  | "PREFIX_OUT_OF_RANGE";

/**
 * Trả MÃ chứ không phải câu chữ: hàm này chạy được ở cả server lẫn client và
 * không có locale, nên việc dịch thuộc về nơi hiển thị.
 */
export function validateEntry(raw: string): EntryError | null {
  const value = raw.trim();
  if (!value) return "EMPTY";

  if (value.includes(":")) return "IPV6_NOT_SUPPORTED";

  if (value.split("/").length > 2) return "MULTIPLE_SLASHES";

  const match = value.match(ENTRY_SHAPE);
  if (!match) return "INVALID_SHAPE";

  if (match.slice(1, 5).some((octet) => Number(octet) > 255)) {
    return "OCTET_OUT_OF_RANGE";
  }

  if (match[5] !== undefined && Number(match[5]) > 32) {
    return "PREFIX_OUT_OF_RANGE";
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
