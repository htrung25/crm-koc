"use client";

import { useId, useRef, useState } from "react";

import { IconPlus, IconShield, IconTrash } from "@/components/ui/icons";
import type { IpWhitelistEntry } from "@/lib/mock/admin/ip-whitelist";

type IpWhitelistManagerProps = {
  /** Danh sách khởi tạo từ server. Component tự quản lý state sau đó. */
  defaultEntries: IpWhitelistEntry[];
  /** IP mà server thấy ở request hiện tại — để người dùng thêm nhanh chính mình. */
  currentIp: string | null;
};

/**
 * Kiểm tra IPv4 đơn hoặc dải CIDR.
 *
 * Chỉ là hàng rào đầu tiên cho phản hồi tức thì; backend vẫn validate lại bằng
 * `netmask`. Cố tình KHÔNG nhận IPv6 vì backend đang chuẩn hoá `::1` về
 * `127.0.0.1` và so khớp qua netmask (chỉ IPv4) — nhận vào sẽ tạo ra mục không
 * bao giờ khớp.
 */
function validateEntry(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Nhập địa chỉ IP hoặc dải CIDR.";

  const [ip, prefix, ...rest] = value.split("/");
  if (rest.length) return "Sai định dạng: chỉ được có một dấu “/”.";

  const octets = ip.split(".");
  if (octets.length !== 4) {
    return "IPv4 gồm 4 nhóm số, ví dụ 203.0.113.9";
  }

  const octetsValid = octets.every(
    (octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255,
  );
  if (!octetsValid) return "Mỗi nhóm phải là số từ 0 đến 255.";

  if (prefix !== undefined) {
    if (!/^\d{1,2}$/.test(prefix) || Number(prefix) > 32) {
      return "Độ dài dải CIDR phải từ 0 đến 32, ví dụ /24";
    }
  }

  return null;
}

/** Đổi IPv4 sang số 32-bit không dấu; trả null nếu không phải IPv4 hợp lệ. */
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

/**
 * IP có được một mục whitelist bao phủ không.
 *
 * Phải xét cả dải chứ không chỉ so bằng: 203.0.113.9 nằm trong 203.0.113.0/24,
 * so khớp chính xác sẽ báo "chưa có" và khiến người dùng thêm trùng một mục
 * vốn đã được cho phép.
 */
function entryCovers(entry: string, ip: string): boolean {
  const [network, prefix] = entry.split("/");
  const target = toUint32(ip);
  const base = toUint32(network);
  if (target === null || base === null) return false;

  if (prefix === undefined) return target === base;

  const bits = Number(prefix);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  if (bits === 0) return true;

  // >>> 0 để giữ kết quả ở miền không dấu sau phép dịch bit của JavaScript.
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (target & mask) >>> 0 === (base & mask) >>> 0;
}

export function IpWhitelistManager({
  defaultEntries,
  currentIp,
}: IpWhitelistManagerProps) {
  const [entries, setEntries] = useState(defaultEntries);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  const valueId = useId();
  const noteId = useId();
  const errorId = useId();
  const valueRef = useRef<HTMLInputElement>(null);

  // Mục bao phủ IP hiện tại (khớp trực tiếp hoặc nằm trong dải CIDR)
  const coveringEntry =
    currentIp === null
      ? undefined
      : entries.find((entry) => entryCovers(entry.value, currentIp));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const message = validateEntry(value);
    if (message) {
      setError(message);
      valueRef.current?.focus(); // đưa con trỏ về đúng ô sai
      return;
    }

    const normalized = value.trim();
    if (entries.some((entry) => entry.value === normalized)) {
      setError("Địa chỉ này đã có trong danh sách.");
      valueRef.current?.focus();
      return;
    }

    // Thêm một IP đã nằm trong dải sẵn có chỉ tạo mục thừa
    const covering = entries.find((entry) => entryCovers(entry.value, normalized));
    if (covering) {
      setError(`Địa chỉ này đã được dải ${covering.value} cho phép.`);
      valueRef.current?.focus();
      return;
    }

    setEntries([
      {
        value: normalized,
        note: note.trim() || "Không có ghi chú",
        addedAt: new Date().toLocaleDateString("vi-VN"),
      },
      ...entries,
    ]);
    setValue("");
    setNote("");
    setError("");
    setStatus(`Đã thêm ${normalized} vào danh sách cho phép.`);
  };

  const handleRemove = (target: string) => {
    setEntries(entries.filter((entry) => entry.value !== target));
    setPendingRemoval(null);
    setStatus(`Đã gỡ ${target} khỏi danh sách.`);
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
              Chỉ những địa chỉ dưới đây mới đăng nhập được cổng quản trị
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#2D3B42]/8 px-2.5 py-1 font-mono text-[11px] font-bold text-[#2D3B42] tnum">
          {entries.length} mục
        </span>
      </div>

      {/* Cảnh báo khi danh sách rỗng: backend coi rỗng là cho phép tất cả */}
      {entries.length === 0 && (
        <p className="mt-4 rounded-2xl bg-amber-500/12 px-4 py-3 text-xs font-semibold text-amber-800">
          Danh sách đang trống nên <strong>mọi địa chỉ đều đăng nhập được</strong>.
          Thêm ít nhất một mục để bật lớp bảo vệ này.
        </p>
      )}

      {/* IP hiện tại — thêm nhầm dải rồi tự khoá mình ra ngoài là rủi ro thật */}
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
              Được cho phép qua{" "}
              <code className="font-mono">{coveringEntry.value}</code>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setValue(currentIp);
                setError("");
                valueRef.current?.focus();
              }}
              className="rounded-full bg-[#EF4623]/12 px-2.5 py-1 text-[11px] font-bold text-[#EF4623] transition-colors hover:bg-[#EF4623]/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30"
            >
              Điền vào ô thêm mới
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label
            htmlFor={valueId}
            className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
          >
            IP hoặc dải CIDR
          </label>
          <input
            id={valueId}
            ref={valueRef}
            name="ip"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            placeholder="203.0.113.9 hoặc 203.0.113.0/24…"
            className="mt-1.5 w-full rounded-2xl border border-[#2D3B42]/15 bg-[#FDF1EE]/50 px-4 py-3 font-mono text-sm text-[#2D3B42] tnum transition-all duration-300 placeholder:font-sans placeholder:text-slate-400 focus:border-[#EF4623] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EF4623]/20"
          />
        </div>

        <div>
          <label
            htmlFor={noteId}
            className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
          >
            Ghi chú
          </label>
          <input
            id={noteId}
            name="note"
            type="text"
            autoComplete="off"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Văn phòng Hà Nội…"
            className="mt-1.5 w-full rounded-2xl border border-[#2D3B42]/15 bg-[#FDF1EE]/50 px-4 py-3 text-sm text-[#2D3B42] transition-all duration-300 placeholder:text-slate-400 focus:border-[#EF4623] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#EF4623]/20"
          />
        </div>

        <button
          type="submit"
          className="mt-1.5 flex items-center justify-center gap-2 self-end rounded-2xl bg-[#EF4623] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#EF4623]/30 transition-all duration-300 hover:bg-[#D83B19] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30"
        >
          <IconPlus className="h-4 w-4" />
          Thêm
        </button>
      </form>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-xs font-semibold text-[#EF4623]"
        >
          {error}
        </p>
      )}

      {/* Thông báo cho screen reader sau mỗi lần thêm/gỡ */}
      <p aria-live="polite" className="sr-only">
        {status}
      </p>

      <div className="-mx-2 mt-5 overflow-x-auto px-2">
        <table className="w-full min-w-[560px] border-collapse">
          <caption className="sr-only">
            Danh sách địa chỉ IP được phép đăng nhập quản trị
          </caption>
          <thead>
            <tr className="text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A7768]">
              <th scope="col" className="pb-3 pr-3 font-bold">Địa chỉ</th>
              <th scope="col" className="pb-3 pr-3 font-bold">Ghi chú</th>
              <th scope="col" className="pb-3 pr-3 font-bold">Ngày thêm</th>
              <th scope="col" className="pb-3 text-right font-bold">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {entries.length === 0 ? (
              <tr className="border-t border-white/70">
                <td colSpan={4} className="py-6 text-center text-xs font-medium text-[#8A7768]">
                  Chưa có địa chỉ nào. Thêm IP đầu tiên ở ô phía trên.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isCurrent =
                  currentIp !== null && entryCovers(entry.value, currentIp);
                const isConfirming = pendingRemoval === entry.value;

                return (
                  <tr
                    key={entry.value}
                    className="border-t border-white/70 transition-colors hover:bg-white/40"
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm font-bold text-[#2D3B42] tnum">
                          {entry.value}
                        </code>
                        {isCurrent && (
                          <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            Bao gồm IP của bạn
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 pr-3 text-sm font-medium text-[#5C5049]">
                      {entry.note}
                    </td>

                    <td className="py-3 pr-3 font-mono text-xs font-medium text-[#5C5049] tnum">
                      {entry.addedAt}
                    </td>

                    <td className="py-3 text-right">
                      {isConfirming ? (
                        // Gỡ IP là thao tác có thể tự khoá mình ra ngoài, nên
                        // phải xác nhận chứ không xoá ngay khi bấm.
                        <span className="inline-flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-[#5C5049]">
                            {isCurrent
                              ? "Gỡ mục đang cho phép IP của bạn?"
                              : "Xác nhận gỡ?"}
                          </span>
                          <button
                            type="button"
                            autoFocus
                            onClick={() => handleRemove(entry.value)}
                            className="rounded-full bg-[#EF4623] px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-[#D83B19] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30"
                          >
                            Gỡ
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingRemoval(null)}
                            className="rounded-full px-3 py-1 text-[11px] font-bold text-[#5C5049] transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2D3B42]/20"
                          >
                            Huỷ
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingRemoval(entry.value)}
                          aria-label={`Gỡ ${entry.value} khỏi danh sách`}
                          className="grid h-9 w-9 place-items-center rounded-xl text-[#8A7768] transition-colors hover:bg-[#EF4623]/10 hover:text-[#EF4623] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 border-t border-[#2D3B42]/10 pt-4 text-[11px] leading-relaxed text-[#8A7768]">
        Thay đổi hiện chỉ lưu trong phiên làm việc — backend chưa mở endpoint
        quản lý whitelist. Khi có API, danh sách sẽ được đồng bộ và áp dụng cho
        <code className="mx-1 font-mono">IpWhitelistGuard</code>ở cổng đăng nhập admin.
      </p>
    </section>
  );
}
