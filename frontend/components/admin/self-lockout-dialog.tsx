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
