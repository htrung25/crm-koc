'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ROUTES } from '@/constants/routes';
import { apiFetch, ApiRequestError, readJson } from '@/lib/api/browser-client';
import type { AccountStatus } from '@/features/admin/types';

type Props = {
  id: string;
  name: string;
  status: AccountStatus;
  kind: 'brand' | 'creator';
  onChanged?: () => void;
};

export function AccountStatusAction(props: Props) {
  const [open, setOpen] = useState(false);
  const locked = props.status === 3 || props.status === 4;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${locked ? 'Mở khóa' : 'Khóa'} tài khoản ${props.name}`}
        className="rounded-xl bg-[#2D3B42]/6 px-3 py-2 text-xs font-bold text-[#5C5049] hover:bg-[#2D3B42]/10 focus-visible:outline-2 focus-visible:outline-[#EF4623]"
      >
        {locked ? 'Mở khóa' : 'Khóa'}
      </button>
      {open && (
        <StatusDialog
          {...props}
          locked={locked}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function StatusDialog({
  id,
  name,
  kind,
  locked,
  onChanged,
  onClose,
}: Props & { locked: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [reason, setReason] = useState('');
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      await readJson(
        await apiFetch(API_ROUTES.admin.accountStatus(id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: locked ? 2 : 4,
            statusReason: locked ? null : reason.trim() || null,
          }),
        })
      );
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: [kind === 'brand' ? 'admin-brands' : 'admin-creators'],
        }),
        client.invalidateQueries({ queryKey: ['admin-creator', id] }),
      ]);
      onClose();
      onChanged?.();
    },
  });
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const error =
    mutation.error instanceof ApiRequestError && mutation.error.status === 401
      ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      : mutation.error?.message;
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!mutation.isPending) onClose();
      }}
      className="m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-x-hidden overflow-y-auto rounded-3xl bg-white p-6 text-left whitespace-normal text-[#2D3B42] shadow-xl [overflow-wrap:anywhere] backdrop:bg-black/40 sm:p-8"
    >
      <form
        className="min-w-0 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!mutation.isPending) mutation.mutate();
        }}
      >
        <h2 id={titleId} className="text-xl leading-snug font-bold">
          {locked ? 'Mở khóa' : 'Khóa'} tài khoản{' '}
          {kind === 'brand' ? 'Brand' : 'Creator'}
        </h2>
        <p className="text-sm leading-relaxed">
          {locked
            ? 'Cho phép tài khoản hoạt động trở lại'
            : 'Chặn đăng nhập và thu hồi các phiên đang hoạt động'}
          : <strong>{name}</strong>.
        </p>
        {!locked && (
          <label className="block text-sm font-semibold">
            Lý do khóa (không bắt buộc)
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              disabled={mutation.isPending}
              rows={3}
              className="mt-2 block w-full min-w-0 max-w-full resize-y rounded-xl border border-[#8A7768]/30 p-3 text-sm font-normal focus:border-[#EF4623] focus:outline-none focus:ring-2 focus:ring-[#EF4623]/20"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={onClose}
            className="rounded-xl px-4 py-2 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-xl bg-[#EF4623] px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            {mutation.isPending
              ? 'Đang xử lý…'
              : locked
                ? 'Mở khóa'
                : 'Khóa tài khoản'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
