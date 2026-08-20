"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";

import { useRouter } from "@/src/i18n/navigation";

import { IconSearch } from "@/src/components/ui/icons";
import {
  DEFAULT_QUERY,
  STATUS_CODES,
  type BrandPage,
  type BrandQuery,
  type BrandRow,
} from "@/src/features/admin/brands/types";
import { apiFetch } from "@/src/lib/api/fetch-client";

/** Nền huy hiệu theo trạng thái. Khoá là EAccountStatus của backend. */
const STATUS_STYLE: Record<number, string> = {
  1: "bg-amber-400/25 text-amber-800",
  2: "bg-emerald-500/15 text-emerald-700",
  3: "bg-rose-500/12 text-rose-600",
  4: "bg-[#2D3B42]/10 text-[#5C5049]",
};

const SORT_PRESETS = {
  newest: { sortBy: "createdAt", sortOrder: "DESC" },
  oldest: { sortBy: "createdAt", sortOrder: "ASC" },
  name: { sortBy: "name", sortOrder: "ASC" },
  email: { sortBy: "email", sortOrder: "ASC" },
} as const;

type SortPreset = keyof typeof SORT_PRESETS;

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" />
    </svg>
  );
}

function IconBin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  );
}

/** Nền avatar xoay vòng theo id để mỗi thương hiệu có một sắc riêng ổn định. */
const AVATAR_TINTS = [
  "from-[#EF4623] to-[#F49E4C]",
  "from-[#7C5CFF] to-[#A78BFA]",
  "from-[#14B8A6] to-[#5EEAD4]",
  "from-[#F59E0B] to-[#FCD34D]",
  "from-[#EC4899] to-[#F9A8D4]",
  "from-[#3B82F6] to-[#93C5FD]",
];

function tintFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

export function AdminBrandList() {
  const t = useTranslations("admin.brands");
  const format = useFormatter();
  const router = useRouter();

  const [query, setQuery] = useState<BrandQuery>(DEFAULT_QUERY);
  const [searchDraft, setSearchDraft] = useState("");

  // Gõ tới đâu gọi API tới đó sẽ bắn một request mỗi ký tự; chờ 350ms cho
  // người dùng gõ xong rồi mới hỏi server.
  useEffect(() => {
    const timer = setTimeout(
      () => setQuery((q) => ({ ...q, search: searchDraft, page: 1 })),
      350,
    );
    return () => clearTimeout(timer);
  }, [searchDraft]);

  const brandsQuery = useQuery({
    // query nằm trong key nên đổi bộ lọc là react-query tự nạp lại và tự huỷ
    // request cũ — không phải tự dựng AbortController.
    queryKey: ["admin-brands", query],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        page: String(query.page),
        limit: String(query.limit),
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });
      if (query.search) params.set("search", query.search);
      if (query.status) params.set("status", String(query.status));

      const response = await apiFetch(`/api/admin/brands?${params}`, { signal });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const failure = (body ?? {}) as { message?: string };
        const error = new Error(failure.message ?? "") as Error & {
          status: number;
        };
        error.status = response.status;
        throw error;
      }

      return body as BrandPage;
    },
    // Giữ trang cũ trên màn hình khi đổi trang, tránh bảng nhấp nháy về rỗng.
    placeholderData: (previous) => previous,
  });

  const page = brandsQuery.data ?? null;
  const loading = brandsQuery.isPending;

  // apiFetch đã tự thử refresh một lần; còn 401 nghĩa là phiên đã chết.
  useEffect(() => {
    const status = (brandsQuery.error as (Error & { status?: number }) | null)
      ?.status;
    if (status === 401) router.replace("/admin");
  }, [brandsQuery.error, router]);

  const error =
    brandsQuery.error && !loading ? brandsQuery.error.message : null;

  const rows: BrandRow[] = page?.data ?? [];
  const total = page?.total ?? 0;
  const totalPages = Math.max(1, page?.totalPages ?? 1);

  const activePreset = useMemo<SortPreset>(() => {
    const found = (Object.keys(SORT_PRESETS) as SortPreset[]).find(
      (key) =>
        SORT_PRESETS[key].sortBy === query.sortBy &&
        SORT_PRESETS[key].sortOrder === query.sortOrder,
    );
    return found ?? "newest";
  }, [query.sortBy, query.sortOrder]);

  const from = total ? (query.page - 1) * query.limit + 1 : 0;
  const to = Math.min(query.page * query.limit, total);

  return (
    <section className="space-y-4">
      <div className="glass rounded-[26px] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
          <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
              {t("search")}
            </span>
            <span className="flex h-12 items-center gap-3 rounded-2xl bg-white/65 px-4 ring-1 ring-[#2D3B42]/10 focus-within:ring-2 focus-within:ring-[#EF4623]/35">
              <IconSearch className="h-4 w-4 shrink-0 text-[#8A7768]" />
              <input
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-full w-full bg-transparent text-sm font-semibold text-[#2D3B42] outline-none placeholder:font-medium placeholder:text-[#8A7768]/70"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
              {t("status")}
            </span>
            <select
              value={query.status}
              onChange={(event) =>
                setQuery((q) => ({
                  ...q,
                  status: event.target.value
                    ? (Number(event.target.value) as BrandQuery["status"])
                    : "",
                  page: 1,
                }))
              }
              className="h-12 w-full rounded-2xl bg-white/65 px-4 text-sm font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
            >
              <option value="">{t("allStatuses")}</option>
              {STATUS_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`statuses.${code}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
              {t("sort")}
            </span>
            <select
              value={activePreset}
              onChange={(event) => {
                const preset = SORT_PRESETS[event.target.value as SortPreset];
                setQuery((q) => ({ ...q, ...preset, page: 1 }));
              }}
              className="h-12 w-full rounded-2xl bg-white/65 px-4 text-sm font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
            >
              <option value="newest">{t("sortNewest")}</option>
              <option value="oldest">{t("sortOldest")}</option>
              <option value="name">{t("sortName")}</option>
              <option value="email">{t("sortEmail")}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-[26px]">
        <div className="flex items-center justify-between gap-3 border-b border-[#2D3B42]/10 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-extrabold text-[#2D3B42]">
              {t("heading")}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-[#8A7768]">
              {t("count", { count: total })}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void brandsQuery.refetch()}
            className="rounded-xl px-3 py-2 text-xs font-extrabold text-[#EF4623] transition-colors hover:bg-[#EF4623]/10 disabled:opacity-50"
          >
            {t("refresh")}
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="border-b border-[#2D3B42]/10 bg-red-500/8 px-5 py-3 text-xs font-semibold text-red-700 sm:px-6"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="px-5 py-12 text-center text-sm font-semibold text-[#8A7768] sm:px-6">
            {t("loading")}
          </p>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center sm:px-6">
            <p className="text-sm font-extrabold text-[#2D3B42]">{t("empty")}</p>
            <p className="mt-1 text-xs font-semibold text-[#8A7768]">
              {t("emptyHint")}
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((brand) => {
              return (
                <li
                  key={brand.id}
                  className="flex flex-col rounded-[22px] bg-white/75 p-5 ring-1 ring-[#2D3B42]/8 transition-shadow hover:shadow-lg hover:shadow-[#2D3B42]/5"
                >
                  <div className="flex items-start gap-3">
                    {brand.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={brand.logoUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-base font-extrabold text-white ${tintFor(brand.id)}`}
                      >
                        {initials(brand.name)}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-extrabold leading-tight text-[#2D3B42]">
                        {brand.name}
                      </h3>
                      <p className="mt-0.5 truncate text-xs font-semibold text-[#8A7768]">
                        {brand.industry || t("noIndustry")}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        STATUS_STYLE[brand.status] ??
                        "bg-[#2D3B42]/8 text-[#5C5049]"
                      }`}
                    >
                      {t(`statuses.${brand.status}`)}
                    </span>
                  </div>

                  <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-[#2D3B42]/8 pt-4">
                    {(
                      [
                        ["statCampaigns", brand.campaignCount],
                        ["statKocs", brand.kocCount],
                        ["statBudget", brand.budget],
                      ] as const
                    ).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-[11px] font-semibold text-[#8A7768]">
                          {t(key)}
                        </dt>
                        <dd className="mt-0.5 text-lg font-extrabold text-[#2D3B42] tnum">
                          {format.number(value ?? 0, { notation: "compact" })}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5 flex items-center gap-2 border-t border-[#2D3B42]/8 pt-4">
                    <button
                      type="button"
                      disabled
                      title={t("comingSoon")}
                      className="flex h-10 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#EF4623]/10 text-sm font-extrabold text-[#EF4623] opacity-70"
                    >
                      <IconEye />
                      {t("view")}
                    </button>
                    <button
                      type="button"
                      disabled
                      title={t("comingSoon")}
                      aria-label={t("edit")}
                      className="grid h-10 w-10 cursor-not-allowed place-items-center rounded-xl bg-[#2D3B42]/6 text-[#5C5049] opacity-70"
                    >
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      disabled
                      title={t("comingSoon")}
                      aria-label={t("delete")}
                      className="grid h-10 w-10 cursor-not-allowed place-items-center rounded-xl bg-red-500/10 text-red-600 opacity-70"
                    >
                      <IconBin />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#2D3B42]/10 px-5 py-4">
          <p className="text-xs font-semibold text-[#8A7768]">
            {t("pagination", { from, to, total })}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={query.page === 1 || loading}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 text-[#5C5049] ring-1 ring-[#2D3B42]/10 disabled:opacity-35"
            >
              <Chevron direction="left" />
            </button>
            <span className="grid h-9 min-w-9 place-items-center rounded-xl bg-[#EF4623] px-3 font-mono text-xs font-extrabold text-white">
              {query.page}
            </span>
            <button
              type="button"
              disabled={query.page >= totalPages || loading}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 text-[#5C5049] ring-1 ring-[#2D3B42]/10 disabled:opacity-35"
            >
              <Chevron direction="right" />
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#8A7768]">
            <select
              value={query.limit}
              onChange={(event) =>
                setQuery((q) => ({
                  ...q,
                  limit: Number(event.target.value),
                  page: 1,
                }))
              }
              className="h-9 rounded-xl bg-white/55 px-3 font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            {t("rowsPerPage")}
          </label>
        </div>
      </div>
    </section>
  );
}
