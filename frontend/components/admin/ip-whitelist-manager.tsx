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

      <p aria-live="polite" className="sr-only">
        {unrestricted
          ? "Danh sách trống. Mọi địa chỉ IP đều truy cập được."
          : `Danh sách có ${entries.length} mục.`}
      </p>

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
                disabled={pending}
                onClick={() => {
                  clearAll();
                  setConfirmingClear(false);
                }}
                className="rounded-full bg-[#EF4623] px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-[#D83B19] disabled:cursor-not-allowed disabled:opacity-50"
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
