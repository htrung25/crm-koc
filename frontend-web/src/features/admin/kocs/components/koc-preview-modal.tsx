'use client';

import { useEffect, useId, useRef } from 'react';
import { KocPlatformBadge } from './koc-platform-badge';
import { KocStatusBadge } from './koc-status-badge';
import type { KocItem } from '../types';

const card = 'rounded-2xl border border-[#ECECF3] bg-white shadow-sm';
const empty = 'Chưa có dữ liệu';

function RatingStars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`${rating} trên 5 sao`}
      className="relative inline-block whitespace-nowrap text-xl leading-none tracking-wider"
    >
      <span aria-hidden="true" className="text-[#E2E2EC]">
        ★★★★★
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 overflow-hidden text-amber-500"
        style={{ width: `${Math.min(5, Math.max(0, rating)) * 20}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

export function KocPreviewModal({
  koc,
  onClose,
}: {
  koc: KocItem;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reviews = koc.brandReviews;
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
      className="m-auto max-h-[92dvh] w-[calc(100%_-_2rem)] max-w-6xl overflow-y-auto rounded-[24px] border-0 bg-[#F6F6FB] p-0 text-[#252438] shadow-2xl backdrop:bg-[#171827]/55 backdrop:backdrop-blur-sm"
    >
      <header className="sticky top-0 z-10 flex items-start gap-4 border-b border-[#ECECF3] bg-white/95 px-5 py-5 backdrop-blur-md sm:px-7">
        <span
          aria-hidden="true"
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${koc.avatarGradient} text-lg font-extrabold text-white sm:h-16 sm:w-16`}
        >
          {koc.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            className="break-words text-xl font-extrabold sm:text-2xl"
          >
            {koc.name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="break-all font-mono text-sm text-[#75748A]">
              {koc.handle}
            </span>
            <div
              aria-label="Nền tảng đã liên kết"
              className="flex flex-wrap gap-1.5"
            >
              {koc.followers.map(({ platform }) => (
                <KocPlatformBadge key={platform} platform={platform} count="" />
              ))}
            </div>
            <span className="rounded-full bg-[#EF4623]/8 px-3 py-1 text-xs font-bold text-[#B6381D]">
              {koc.category}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hồ sơ Creator"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-2xl text-[#75748A] hover:bg-[#F6F6FB] focus-visible:outline-2 focus-visible:outline-[#EF4623]"
        >
          ×
        </button>
      </header>

      <div className="space-y-6 p-4 sm:p-7">
        <section
          aria-label="Giới thiệu và trạng thái"
          className={`${card} p-5`}
        >
          <h3 className="text-sm font-bold">Bio</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[#75748A]">
            {koc.bio?.trim() || 'Creator chưa cập nhật giới thiệu bản thân.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F0F6] pt-4">
            <span className="text-sm text-[#75748A]">Trạng thái</span>
            <KocStatusBadge status={koc.status} />
          </div>
          {koc.email || koc.phone ? (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#F0F0F6] pt-4 text-xs text-[#75748A]">
              {koc.email ? (
                <span className="break-all">Email: {koc.email}</span>
              ) : null}
              {koc.phone ? <span>Điện thoại: {koc.phone}</span> : null}
            </div>
          ) : null}
        </section>

        <section
          aria-label="Thống kê Creator"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className={`${card} p-5`}>
            <h3 className="text-sm text-[#89889F]">Chiến dịch</h3>
            <p className="mt-2 text-3xl font-extrabold tabular-nums">
              {koc.campaigns}
            </p>
          </div>
          <div className={`${card} p-5`}>
            <h3 className="text-sm text-[#89889F]">Tổng doanh thu</h3>
            <p className="mt-2 text-3xl font-extrabold tabular-nums">
              {koc.revenue}
            </p>
          </div>
        </section>

        <section aria-labelledby={`${titleId}-platforms`}>
          <h3 id={`${titleId}-platforms`} className="mb-3 text-base font-bold">
            Chỉ số theo nền tảng
          </h3>
          {koc.followers.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {koc.followers.map((follower) => {
                const metrics = koc.platformMetrics?.find(
                  (item) => item.platform === follower.platform
                );
                const engagement = koc.engagement.find(
                  (item) => item.platform === follower.platform
                );
                const likes = metrics?.totalLikes ?? metrics?.averageLikes;
                return (
                  <div key={follower.platform} className={`${card} p-5`}>
                    <KocPlatformBadge platform={follower.platform} count="" />
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[#89889F]">Người theo dõi</dt>
                        <dd className="font-bold tabular-nums">
                          {follower.count}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[#89889F]">Lượt xem trung bình</dt>
                        <dd className="text-right font-bold tabular-nums">
                          {metrics?.averageViews ?? empty}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[#89889F]">
                          {metrics?.totalLikes == null &&
                          metrics?.averageLikes != null
                            ? 'Lượt thích trung bình'
                            : 'Tổng lượt thích'}
                        </dt>
                        <dd
                          className={`text-right font-bold tabular-nums ${likes != null ? 'text-[#EE5A91]' : ''}`}
                        >
                          {likes ?? empty}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[#89889F]">Tỉ lệ tương tác</dt>
                        <dd className="text-right font-bold tabular-nums text-emerald-600">
                          {engagement?.rate ?? empty}
                        </dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={`${card} p-6 text-center text-sm text-[#89889F]`}>
              Chưa có nền tảng liên kết.
            </p>
          )}
        </section>

        <section aria-labelledby={`${titleId}-reviews`}>
          <h3 id={`${titleId}-reviews`} className="mb-3 text-base font-bold">
            Đánh giá từ thương hiệu
          </h3>
          <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
            <div
              className={`${card} flex min-h-44 flex-col items-center justify-center gap-3 p-5`}
            >
              <p className="text-4xl font-extrabold tabular-nums">
                {reviews ? reviews.averageRating.toFixed(1) : '—'}
              </p>
              {reviews ? <RatingStars rating={reviews.averageRating} /> : null}
              <p className="text-xs text-[#89889F]">
                {reviews
                  ? `${reviews.reviews.length} lượt đánh giá`
                  : 'Chưa có đánh giá'}
              </p>
            </div>
            <div className={`${card} flex flex-col justify-center gap-5 p-5`}>
              {[
                {
                  label: 'Chất lượng nội dung',
                  value: reviews?.contentQuality,
                  color: 'from-[#7C4DFF] to-[#A371F7]',
                },
                {
                  label: 'Đúng deadline',
                  value: reviews?.timeliness,
                  color: 'from-[#12B99B] to-[#2AC9EF]',
                },
                {
                  label: 'Chuyên nghiệp',
                  value: reviews?.professionalism,
                  color: 'from-[#FFB21E] to-[#FF7862]',
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between gap-3 text-xs">
                    <span>{item.label}</span>
                    <span className="font-bold">
                      {item.value != null ? `${item.value.toFixed(1)}/5` : '—'}
                    </span>
                  </div>
                  <div
                    role={item.value != null ? 'meter' : undefined}
                    aria-label={item.label}
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-valuenow={item.value}
                    className="h-2 overflow-hidden rounded-full bg-[#EEEEF6]"
                  >
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                      style={{
                        width: `${Math.min(5, Math.max(0, item.value ?? 0)) * 20}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {reviews?.reviews.length ? (
            <div className="mt-4 space-y-3">
              {reviews.reviews.map((review) => (
                <article key={review.id} className={`${card} p-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold">{review.brand}</h4>
                      <p className="mt-1 text-xs text-[#89889F]">
                        {review.campaign} · {review.date}
                      </p>
                    </div>
                    <RatingStars rating={review.rating} />
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#75748A]">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section
          aria-labelledby={`${titleId}-history`}
          className={`${card} overflow-hidden`}
        >
          <h3
            id={`${titleId}-history`}
            className="px-5 py-5 text-base font-bold"
          >
            Lịch sử chiến dịch
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">
                Lịch sử chiến dịch của {koc.name}
              </caption>
              <thead className="border-y border-[#F0F0F6] bg-[#FAFAFE] text-[11px] uppercase tracking-wide text-[#89889F]">
                <tr>
                  {[
                    'Chiến dịch',
                    'Thương hiệu',
                    'Thời gian',
                    'Doanh thu',
                    'Trạng thái',
                  ].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="px-5 py-3.5 font-semibold"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F6]">
                {koc.campaignHistory?.length ? (
                  koc.campaignHistory.map((row) => (
                    <tr key={row.id}>
                      <th scope="row" className="px-5 py-4 font-semibold">
                        {row.campaign}
                      </th>
                      <td className="px-5 py-4 text-[#75748A]">{row.brand}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#89889F]">
                        {row.period}
                      </td>
                      <td className="px-5 py-4 font-bold tabular-nums">
                        {row.revenue}
                      </td>
                      <td className="px-5 py-4">
                        <KocStatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-[#89889F]"
                    >
                      Chưa có lịch sử chiến dịch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </dialog>
  );
}
