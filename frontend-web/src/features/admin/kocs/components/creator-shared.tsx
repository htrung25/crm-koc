'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { APP_ROUTES } from '@/constants/routes';
import { ApiRequestError } from '@/lib/api/browser-client';
export const creatorButton =
  'rounded-xl px-4 py-2 text-sm font-bold text-ink ring-1 ring-ink/15 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40';
export function CreatorError({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const t = useTranslations('creatorProfile');
  const status = error instanceof ApiRequestError ? error.status : 0;
  const key =
    status === 401
      ? 'sessionExpired'
      : status === 403
        ? 'forbidden'
        : status === 404
          ? 'notFound'
          : 'error';
  return (
    <div
      role="alert"
      className="rounded-2xl bg-rose-50 p-6 text-center text-sm text-rose-900"
    >
      <p>{t(key)}</p>
      {status === 401 ? (
        <Link
          href={APP_ROUTES.admin.login}
          className={`${creatorButton} mt-4 inline-block`}
        >
          {t('signIn')}
        </Link>
      ) : status !== 403 && status !== 404 ? (
        <button
          type="button"
          onClick={retry}
          className={`${creatorButton} mt-4`}
        >
          {t('retry')}
        </button>
      ) : null}
    </div>
  );
}
export function CreatorAccountStatus({ status }: { status: number }) {
  const t = useTranslations('creatorProfile');
  const key = [1, 2, 3, 4].includes(status) ? String(status) : 'unknown';
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${status === 2 ? 'bg-emerald-50 text-emerald-800' : status === 1 ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'}`}
    >
      {t(`accountStatus.${key}`)}
    </span>
  );
}
export function CreatorPagination({
  page,
  pages,
  total,
  disabled,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}) {
  const t = useTranslations('creatorProfile');
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 px-5 py-4">
      <p className="text-xs text-ink-light">
        {t('pagination', { page, pages: Math.max(1, pages), total })}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={creatorButton}
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          {t('previous')}
        </button>
        <button
          type="button"
          className={creatorButton}
          disabled={disabled || page >= pages}
          onClick={() => onChange(page + 1)}
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}
