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

  it("body là mảng không ném lỗi, getters trả undefined", () => {
    const error = new ApiError("mảng", 400, ["a", "b"]);
    expect(error.businessCode).toBeUndefined();
    expect(error.clientIp).toBeUndefined();
  });

  it("body là chuỗi trần không ném lỗi, getters trả undefined", () => {
    const error = new ApiError("chuỗi", 400, "raw string");
    expect(error.businessCode).toBeUndefined();
    expect(error.clientIp).toBeUndefined();
  });

  it("businessCode không phải string trả undefined không phải giá trị", () => {
    const error = new ApiError("số", 400, { businessCode: 123 });
    expect(error.businessCode).toBeUndefined();
  });

  it("clientIp là object lồng trả undefined", () => {
    const error = new ApiError("object lồng", 400, { clientIp: { ip: "1.2.3.4" } });
    expect(error.clientIp).toBeUndefined();
  });
});
