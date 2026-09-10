'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useCreator } from '../hooks/use-creators';
import type { CreatorDetail } from '../creator-types';
import { formatCreatorMetric, safeProfileUrl } from '../creator-format';
import {
  CreatorAccountStatus,
  CreatorError,
  CreatorPagination,
  creatorButton,
} from './creator-shared';

export function KocDetailModal({
  creatorId,
  onClose,
}: {
  creatorId: string;
  onClose: () => void;
}) {
  const t = useTranslations('creatorProfile');
  const titleId = useId();
  const descriptionId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const query = useCreator(creatorId, historyPage);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
      className="m-auto max-h-[92dvh] w-[calc(100%_-_2rem)] max-w-5xl overflow-y-auto rounded-[28px] border-0 bg-[#FAF7F2] p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink/10 bg-[#FAF7F2]/95 px-5 py-4 backdrop-blur-sm sm:px-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 id={titleId} className="text-lg font-extrabold">
              {t('detailTitle')}
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              {t('readOnly')}
            </span>
          </div>
          <p id={descriptionId} className="mt-1 text-xs text-ink-light">
            {t('detailDescription')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className={`${creatorButton} shrink-0 text-lg`}
        >
          ×
        </button>
      </header>
      <div className="p-5 sm:p-8" aria-busy={query.isFetching}>
        {query.isPending ? (
          <div role="status" className="space-y-5 py-6">
            <p className="text-center text-sm text-ink-light">{t('loading')}</p>
            <div
              aria-hidden="true"
              className="grid animate-pulse gap-4 sm:grid-cols-3"
            >
              {[1, 2, 3].map((key) => (
                <div key={key} className="h-28 rounded-2xl bg-ink/5" />
              ))}
            </div>
            <div
              aria-hidden="true"
              className="h-52 animate-pulse rounded-2xl bg-ink/5"
            />
          </div>
        ) : query.isError ? (
          <CreatorError
            error={query.error}
            retry={() => {
              void query.refetch();
            }}
          />
        ) : (
          <CreatorProfileContent
            creator={query.data}
            fetching={query.isFetching}
            onHistoryPage={setHistoryPage}
          />
        )}
      </div>
      <footer className="flex justify-end border-t border-ink/10 px-5 py-4 sm:px-8">
        <button type="button" className={creatorButton} onClick={onClose}>
          {t('close')}
        </button>
      </footer>
    </dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white/80 ring-1 ring-ink/10">
      <h3 className="border-b border-ink/10 px-5 py-4 text-base font-extrabold">
        {title}
      </h3>
      {children}
    </section>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="px-5 py-8 text-center text-sm text-ink-light">{children}</p>
  );
}

export function CreatorProfileContent({
  creator,
  fetching,
  onHistoryPage,
}: {
  creator: CreatorDetail;
  fetching?: boolean;
  onHistoryPage: (page: number) => void;
}) {
  const t = useTranslations('creatorProfile');
  const locale = useLocale();
  const number = (value: string | number | null | undefined) =>
    formatCreatorMetric(value, locale) ?? t('unavailable');
  const money = (value: string | number | null | undefined) =>
    value == null
      ? t('unavailable')
      : `${number(value)} ${creator.statistics?.currency ?? 'VND'}`;
  const date = (value: string | null | undefined) =>
    !value || Number.isNaN(Date.parse(value))
      ? t('notUpdated')
      : new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeZone: 'UTC',
        }).format(new Date(value));
  const profile = creator.profile;
  const name = profile?.displayName || creator.name || creator.email;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const portfolio = safeProfileUrl(profile?.portfolioUrl);
  const avatar = safeProfileUrl(profile?.avatarUrl);
  const reviews = creator.brandReviews;
  const history = creator.campaignHistory;
  const fields = [
    [t('displayName'), profile?.displayName],
    [t('email'), profile?.email ?? creator.email],
    [t('phone'), profile?.phone ?? creator.phone],
    [t('city'), profile?.city],
    [t('address'), profile?.address],
    [t('birthday'), date(profile?.dateOfBirth)],
    [
      t('gender'),
      profile?.gender && [1, 2, 3].includes(profile.gender)
        ? t(`genders.${profile.gender}`)
        : null,
    ],
    [t('categories'), profile?.contentCategories?.join(', ')],
    [t('timezone'), profile?.timezone],
    [t('joined'), date(creator.createdAt)],
    [t('updated'), date(profile?.updatedAt)],
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-orange-300 text-2xl font-extrabold text-white">
          <span aria-hidden="true">{initials}</span>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- Creator avatars come from arbitrary provider hosts.
            <img
              src={avatar}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-2xl font-extrabold">{name}</h3>
          <p className="mt-1 break-all text-sm text-ink-light">
            {creator.email}
          </p>
          <p className="mt-2 break-all font-mono text-[11px] text-ink-light">
            ID: {creator.id}
          </p>
          <p className="mt-2 text-xs text-ink-light">
            {creator.emailVerifiedAt ? t('verified') : t('unverified')}
          </p>
        </div>
        <CreatorAccountStatus status={creator.status} />
      </div>
      <section aria-label={t('overview')} className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: t('completedCampaigns'),
            value: number(creator.statistics?.completedCampaigns),
          },
          {
            label: t('totalRevenue'),
            value: money(creator.statistics?.totalRevenue),
            note: t('revenueNote'),
          },
          {
            label: t('brandRating'),
            value:
              reviews?.averageRating != null
                ? `${number(reviews.averageRating)} / 5`
                : t('unavailable'),
            note: reviews
              ? t('ratingCount', { count: reviews.total })
              : undefined,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-white p-5 ring-1 ring-ink/10"
          >
            <h3 className="text-xs font-bold text-ink-light">{stat.label}</h3>
            <p className="mt-3 break-words text-xl font-extrabold tabular-nums text-primary">
              {stat.value}
            </p>
            {stat.note ? (
              <p className="mt-2 text-xs text-ink-light">{stat.note}</p>
            ) : null}
          </div>
        ))}
      </section>
      <Section title={t('profileTitle')}>
        {profile?.bio ? (
          <div className="border-b border-ink/10 px-5 py-4">
            <h4 className="mb-2 text-xs font-bold text-ink-light">
              {t('bio')}
            </h4>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {profile.bio}
            </p>
          </div>
        ) : null}
        <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-ink-light">{label}</dt>
              <dd className="mt-1 break-words text-sm font-semibold">
                {value || t('notUpdated')}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-xs text-ink-light">{t('portfolio')}</dt>
            <dd className="mt-1 break-all text-sm font-semibold">
              {portfolio ? (
                <a
                  href={portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {portfolio}
                </a>
              ) : (
                t('notUpdated')
              )}
            </dd>
          </div>
        </dl>
      </Section>
      <Section title={t('platformTitle')}>
        {creator.platforms == null ? (
          <Empty>{t('unavailable')}</Empty>
        ) : creator.platforms.length === 0 ? (
          <Empty>{t('noPlatforms')}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <caption className="sr-only">{t('platformTitle')}</caption>
              <thead className="bg-ink/3">
                <tr>
                  {[
                    'platform',
                    'followers',
                    'averageViews',
                    'totalLikes',
                    'engagement',
                  ].map((key) => (
                    <th
                      key={key}
                      scope="col"
                      className="px-5 py-3 text-xs text-ink-light"
                    >
                      {t(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {creator.platforms.map((platform) => (
                  <tr key={platform.id}>
                    <th scope="row" className="px-5 py-4 font-semibold">
                      <p>
                        {(
                          {
                            tiktok: 'TikTok',
                            instagram: 'Instagram',
                            youtube: 'YouTube',
                            facebook: 'Facebook',
                          } as Record<string, string>
                        )[platform.platform.toLowerCase()] ?? platform.platform}
                      </p>
                      {platform.username ? (
                        <p className="mt-1 text-xs font-normal text-ink-light">
                          @{platform.username.replace(/^@/, '')}
                        </p>
                      ) : null}
                      {platform.lastSyncedAt ? (
                        <p className="mt-1 text-[10px] font-normal text-ink-light">
                          {t('synced', { date: date(platform.lastSyncedAt) })}
                        </p>
                      ) : null}
                    </th>
                    <td className="px-5 py-4 tabular-nums">
                      {number(platform.followerCount)}
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      {number(platform.averageViews)}
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      {number(platform.totalLikes)}
                    </td>
                    <td className="px-5 py-4 font-bold tabular-nums text-emerald-700">
                      {platform.engagementRate == null
                        ? t('unavailable')
                        : `${number(platform.engagementRate)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      <Section title={t('reviewsTitle')}>
        {reviews == null ? (
          <Empty>{t('unavailable')}</Empty>
        ) : reviews.data.length === 0 ? (
          <Empty>{t('noReviews')}</Empty>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {reviews.data.map((review) => (
              <article
                key={review.id}
                className="rounded-xl border border-ink/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-bold">{review.brandName}</h4>
                  <span className="shrink-0 text-sm font-bold text-amber-700">
                    ★ {number(review.rating)}/5
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {review.comment || t('noComment')}
                </p>
                <p className="mt-3 text-xs text-ink-light">
                  {date(review.createdAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>
      <Section title={t('historyTitle')}>
        {history == null ? (
          <Empty>{t('unavailable')}</Empty>
        ) : history.data.length === 0 ? (
          <Empty>{t('noHistory')}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">{t('historyTitle')}</caption>
              <thead className="bg-ink/3">
                <tr>
                  {[
                    'campaign',
                    'brand',
                    'period',
                    'revenue',
                    'collaborationStatus',
                  ].map((key) => (
                    <th
                      key={key}
                      scope="col"
                      className="px-5 py-3 text-xs text-ink-light"
                    >
                      {t(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {history.data.map((row) => (
                  <tr key={row.id}>
                    <th
                      scope="row"
                      className="max-w-60 break-words px-5 py-4 font-semibold"
                    >
                      {row.campaignName ||
                        (row.campaignId ? t('notUpdated') : t('standalone'))}
                    </th>
                    <td className="px-5 py-4">
                      {row.brandName || t('notUpdated')}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <p>{date(row.startedAt)}</p>
                      <p className="mt-1 text-ink-light">
                        {row.completedAt ? date(row.completedAt) : t('ongoing')}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums">
                      {money(row.revenue)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${row.status === 4 ? 'bg-emerald-50 text-emerald-800' : row.status === 5 || row.status === 6 ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}
                      >
                        {t(
                          `collaboration.${[1, 2, 3, 4, 5, 6].includes(row.status) ? row.status : 'unknown'}`
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {history && history.total > 0 ? (
          <CreatorPagination
            page={history.page}
            pages={history.totalPages}
            total={history.total}
            disabled={fetching}
            onChange={onHistoryPage}
          />
        ) : null}
      </Section>
    </div>
  );
}
