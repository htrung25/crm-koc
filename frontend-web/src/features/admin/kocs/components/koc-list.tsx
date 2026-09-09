'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useCreators } from '../hooks/use-creators';
import { KocDetailModal } from './koc-detail-modal';
import {
  CreatorAccountStatus,
  CreatorError,
  CreatorPagination,
  creatorButton,
} from './creator-shared';
export function AdminKocList() {
  const t = useTranslations('creatorProfile');
  const locale = useLocale();
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(''),
    status: parseAsStringLiteral(['', '1', '2', '3', '4'] as const).withDefault(
      ''
    ),
  });
  const [draft, setDraft] = useState(params.search);
  const [previousSearch, setPreviousSearch] = useState(params.search);
  if (params.search !== previousSearch) {
    setPreviousSearch(params.search);
    setDraft(params.search);
  }
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [creatorId, setCreatorId] = useState<string | null>(null);
  useEffect(() => {
    if (draft === params.search) return;
    const timer = setTimeout(() => {
      void setParams({ search: draft.trim(), page: 1 });
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, params.search, setParams]);
  const query = useCreators({
    page: Math.max(1, params.page),
    limit: 10,
    search: params.search,
    status: params.status,
  });
  const date = (value: string) =>
    Number.isNaN(Date.parse(value))
      ? '—'
      : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
          new Date(value)
        );
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink-light">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {(['table', 'cards'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              className={`${creatorButton} ${view === mode ? 'bg-white' : ''}`}
              onClick={() => setView(mode)}
            >
              {t(mode)}
            </button>
          ))}
        </div>
      </div>
      <div className="glass grid gap-4 rounded-[26px] p-5 sm:grid-cols-[1fr_220px]">
        <label className="space-y-2 text-sm font-bold text-ink">
          <span className="block">{t('search')}</span>
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-xl bg-white/80 px-4 py-3 font-normal outline-none ring-1 ring-ink/15 focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-2 text-sm font-bold text-ink">
          <span className="block">{t('status')}</span>
          <select
            value={params.status}
            onChange={(e) => {
              void setParams({
                status: e.target.value as typeof params.status,
                page: 1,
              });
            }}
            className="w-full rounded-xl bg-white/80 px-4 py-3 outline-none ring-1 ring-ink/15 focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('all')}</option>
            {[1, 2, 3, 4].map((code) => (
              <option key={code} value={code}>
                {t(`accountStatus.${code}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="glass overflow-hidden rounded-[26px]"
        aria-busy={query.isFetching}
      >
        {query.isPending ? (
          <p role="status" className="p-12 text-center text-sm text-ink-light">
            {t('loading')}
          </p>
        ) : query.isError ? (
          <CreatorError
            error={query.error}
            retry={() => {
              void query.refetch();
            }}
          />
        ) : query.data.data.length === 0 ? (
          <div className="p-12 text-center text-ink">
            <p className="font-bold">{t('empty')}</p>
            <p className="mt-2 text-sm">{t('emptyHint')}</p>
          </div>
        ) : view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-left text-sm">
              <caption className="sr-only">{t('title')}</caption>
              <thead className="bg-white/40 text-xs text-ink-light">
                <tr>
                  {['name', 'phone', 'joined', 'status', 'view'].map((key) => (
                    <th key={key} scope="col" className="px-5 py-4">
                      {t(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {query.data.data.map((creator) => (
                  <tr key={creator.id} className="hover:bg-white/40">
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setCreatorId(creator.id)}
                        className="rounded text-left font-bold text-ink hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        {creator.name || creator.email}
                      </button>
                      <p className="mt-1 text-xs text-ink-light">
                        {creator.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">{creator.phone || '—'}</td>
                    <td className="px-5 py-4">{date(creator.createdAt)}</td>
                    <td className="px-5 py-4">
                      <CreatorAccountStatus status={creator.status} />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        aria-label={t('viewName', {
                          name: creator.name || creator.email,
                        })}
                        onClick={() => setCreatorId(creator.id)}
                        className={creatorButton}
                      >
                        {t('view')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {query.data.data.map((creator) => (
              <article
                key={creator.id}
                className="space-y-4 rounded-2xl bg-white/75 p-5 ring-1 ring-ink/10"
              >
                <CreatorAccountStatus status={creator.status} />
                <h2 className="font-extrabold text-ink">
                  {creator.name || creator.email}
                </h2>
                <p className="break-all text-sm text-ink-light">
                  {creator.email}
                </p>
                <p className="text-xs text-ink-light">
                  {t('joined')}: {date(creator.createdAt)}
                </p>
                <button
                  type="button"
                  aria-label={t('viewName', {
                    name: creator.name || creator.email,
                  })}
                  className={creatorButton}
                  onClick={() => setCreatorId(creator.id)}
                >
                  {t('view')}
                </button>
              </article>
            ))}
          </div>
        )}
        {query.data && !query.isError ? (
          <CreatorPagination
            page={query.data.page}
            pages={query.data.totalPages}
            total={query.data.total}
            disabled={query.isFetching}
            onChange={(page) => {
              void setParams({ page });
            }}
          />
        ) : null}
      </div>
      {creatorId ? (
        <KocDetailModal
          key={creatorId}
          creatorId={creatorId}
          onClose={() => setCreatorId(null)}
        />
      ) : null}
    </section>
  );
}
