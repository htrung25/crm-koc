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
