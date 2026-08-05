"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
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
  SUPER_ADMIN_REQUIRED,
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
  const router = useRouter();
  const [entries, setEntries] = useState(() => parseWhitelist(initialWhitelist));
  const [error, setError] = useState<string | null>(null);
  const [lockout, setLockout] = useState<Lockout | null>(null);
  // Giữ lại thao tác vừa bị 422 để nút "Vẫn lưu" gửi lại đúng nó.
  const [lastVariables, setLastVariables] = useState<Variables | null>(null);
  // 403 REQUIRES_SUPER_ADMIN -> khoá UI về chỉ-đọc (spec §7), tránh bấm lại
  // ăn 403 liên tục vì canEdit ở prop cha không tự biết quyền vừa mất.
  const [forbidden, setForbidden] = useState(false);

  const mutation = useMutation({
    mutationFn: send,
    onMutate: () => {
      setError(null);
    },
    onSuccess: (data) => {
      setLockout(null);
      setLastVariables(null);
      setEntries(parseWhitelist(data.ipWhitelist));
      // RSC payload trong Router Cache vẫn giữ initialWhitelist cũ; làm mới để
      // Back/điều hướng lại không đè state đúng bằng dữ liệu cũ.
      router.refresh();
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

      if (
        failure.status === 403 &&
        failure.businessCode === SUPER_ADMIN_REQUIRED
      ) {
        setForbidden(true);
        setError(failure.message);
        return;
      }

      // apiFetch đã tự thử refresh một lần; còn 401 nghĩa là phiên đã chết.
      if (failure.status === 401) {
        router.replace("/admin");
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

  /**
   * Nút chính của SelfLockoutDialog. PHẢI phái sinh payload từ `lastVariables`
   * (thao tác vừa bị 422), KHÔNG từ `entries` (state cũ, chưa hề đổi vì
   * mutation thất bại) — nếu không, ý định gốc của người dùng (replace bằng
   * danh sách mới, hoặc remove một mục) sẽ bị vứt bỏ âm thầm, chỉ còn
   * `entries + clientIp` được gửi mà UI vẫn báo "đã lưu".
   */
  const addCurrentIpAndRetry = useCallback(
    (clientIp: string) => {
      if (!lastVariables) {
        // Không nên xảy ra vì dialog chỉ hiện sau 422, nhưng rơi về hành vi
        // addEntry cũ để không im lặng bỏ qua thao tác của người dùng.
        addEntry(clientIp);
        return;
      }

      const { operation } = lastVariables;
      const nextList =
        operation.kind === "replace"
          ? operation.list
          : entries.filter((e) => e !== operation.entry);

      // Khử trùng lặp: nếu clientIp đã có trong danh sách sắp gửi thì thôi.
      const withClientIp = nextList.includes(clientIp)
        ? nextList
        : [...nextList, clientIp];

      // Đi qua `replace` (không gọi thẳng `mutate`) để chốt độ dài
      // MAX_WHITELIST_LENGTH cũng áp dụng ở đây — backend vẫn chặn nếu bỏ
      // qua, nhưng lỗi tới muộn hơn một vòng mạng. `replace` luôn gửi
      // acknowledge: false, đúng thứ ta cần cho lần thử lại này.
      replace(withClientIp);
    },
    [lastVariables, entries, addEntry, replace],
  );

  return {
    entries,
    pending: mutation.isPending,
    error,
    lockout,
    forbidden,
    addEntry,
    removeEntry,
    clearAll,
    forceLastAction,
    addCurrentIpAndRetry,
    dismissLockout: useCallback(() => setLockout(null), []),
    clearError: useCallback(() => setError(null), []),
  };
}
