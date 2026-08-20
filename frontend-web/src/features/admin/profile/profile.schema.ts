import type { UpdateAdminProfile } from "@/features/admin/profile/types";

export type ProfileParseError = {
  message: string;
  businessCode: "INVALID_BODY" | "INVALID_NAME" | "INVALID_EMAIL"
    | "INVALID_AVATAR_URL" | "INVALID_TIMEZONE";
};

/**
 * Lọc body PATCH /api/admin/profile.
 *
 * Chỉ chuyển tiếp đúng những khoá CÓ MẶT trong body: thiếu khoá nghĩa là "đừng
 * đụng tới field này", còn gửi kèm `undefined` sẽ bị backend hiểu thành xoá.
 * Sai kiểu trả về mã riêng cho từng field để giao diện chỉ ra đúng ô cần sửa.
 */
export function parseProfileUpdate(
  body: unknown,
): { ok: true; payload: UpdateAdminProfile } | { ok: false; error: ProfileParseError } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      ok: false,
      error: { message: "Body không hợp lệ", businessCode: "INVALID_BODY" },
    };
  }

  const source = body as Record<string, unknown>;
  const payload: UpdateAdminProfile = {};

  if ("name" in source) {
    if (source.name !== null && typeof source.name !== "string") {
      return {
        ok: false,
        error: { message: "name không hợp lệ", businessCode: "INVALID_NAME" },
      };
    }
    payload.name = source.name as string | null;
  }

  if ("email" in source) {
    if (typeof source.email !== "string") {
      return {
        ok: false,
        error: { message: "email không hợp lệ", businessCode: "INVALID_EMAIL" },
      };
    }
    payload.email = source.email;
  }

  if ("avatarUrl" in source) {
    if (source.avatarUrl !== null && typeof source.avatarUrl !== "string") {
      return {
        ok: false,
        error: {
          message: "avatarUrl không hợp lệ",
          businessCode: "INVALID_AVATAR_URL",
        },
      };
    }
    payload.avatarUrl = source.avatarUrl as string | null;
  }

  if ("timezone" in source) {
    if (typeof source.timezone !== "string") {
      return {
        ok: false,
        error: {
          message: "timezone không hợp lệ",
          businessCode: "INVALID_TIMEZONE",
        },
      };
    }
    payload.timezone = source.timezone;
  }

  return { ok: true, payload };
}
