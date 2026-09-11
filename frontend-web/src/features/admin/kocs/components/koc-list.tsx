'use client';

import { useEffect, useState } from 'react';
import { IconChevron, IconSearch } from '@/components/ui/icons';
import { useCreators } from '../hooks/use-creators';
import { creatorListItem } from '../creator-list-adapter';
import { CREATOR_ACCOUNT_STATES } from '../creator-domain';
import type { KocFilterStatus, KocItem, KocViewMode } from '../types';
import { KocTableView } from './koc-table-view';
import { KocCardsView } from './koc-cards-view';
import { KocPreviewModal } from './koc-preview-modal';

const FILTER_TABS: { key: KocFilterStatus; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: CREATOR_ACCOUNT_STATES.active.label },
  { key: 'pending', label: CREATOR_ACCOUNT_STATES.pending.label },
  { key: 'suspended', label: CREATOR_ACCOUNT_STATES.suspended.label },
  { key: 'banned', label: CREATOR_ACCOUNT_STATES.banned.label },
];

export function AdminKocList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<KocViewMode>('table');
  const [statusFilter, setStatusFilter] = useState<KocFilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [viewingKoc, setViewingKoc] = useState<KocItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const query = useCreators({
    page,
    limit: 10,
    search,
    status:
      statusFilter === 'all'
        ? ''
        : String(CREATOR_ACCOUNT_STATES[statusFilter].code),
  });
  const filteredItems = query.data?.data.map(creatorListItem) ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, query.data?.totalPages ?? 1);

  return (
    <section className="space-y-4">
      <p className="rounded-xl bg-amber-50 px-4 py-2 text-xs text-amber-900">
        Các chỉ số và lĩnh vực chưa được cung cấp hiển thị “—”.
      </p>
      {/* Top Header Section matching Mockup */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#2D3B42]">
            Danh sách KOC
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-[#8A7768]">
            Tra cứu hồ sơ và trạng thái tài khoản Creator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle: Bảng / Thẻ */}
          <div className="inline-flex rounded-2xl bg-white/70 p-1 ring-1 ring-[#2D3B42]/10 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#2D3B42] shadow-xs ring-1 ring-[#2D3B42]/5 font-extrabold'
                  : 'text-[#8A7768] hover:text-[#2D3B42]'
              }`}
            >
              Bảng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-[#2D3B42] shadow-xs ring-1 ring-[#2D3B42]/5 font-extrabold'
                  : 'text-[#8A7768] hover:text-[#2D3B42]'
              }`}
            >
              Thẻ
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs matching mockup */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {FILTER_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition-all duration-200 ${
                isActive
                  ? 'border-2 border-[#EF4623] bg-[#EF4623]/10 text-[#EF4623] shadow-xs'
                  : 'border border-transparent bg-white/70 text-[#5C5049] hover:bg-white hover:text-[#2D3B42] ring-1 ring-[#2D3B42]/8'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="glass rounded-[26px] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
              Tìm kiếm KOC
            </span>
            <span className="flex h-12 items-center gap-3 rounded-2xl bg-white/65 px-4 ring-1 ring-[#2D3B42]/10 focus-within:ring-2 focus-within:ring-[#EF4623]/35">
              <IconSearch className="h-4 w-4 shrink-0 text-[#8A7768]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên hoặc email…"
                className="h-full w-full bg-transparent text-sm font-semibold text-[#2D3B42] outline-none placeholder:font-medium placeholder:text-[#8A7768]/70"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
              Lĩnh vực
            </span>
            <select
              disabled
              value=""
              title="API chưa cung cấp bộ lọc lĩnh vực"
              className="h-12 w-full rounded-2xl bg-white/65 px-4 text-sm font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
            >
              <option value="">Chưa có dữ liệu lĩnh vực</option>
            </select>
          </label>
        </div>
      </div>

      {/* Main Content: Table or Cards View */}
      <div className="glass overflow-hidden rounded-[26px]">
        {query.isPending ? (
          <p className="p-8 text-center">Đang tải Creator…</p>
        ) : query.isError ? (
          <div role="alert" className="p-6 text-red-700">
            <p>{query.error.message}</p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-3 underline"
            >
              Thử lại
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-5 py-14 text-center sm:px-6">
            <p className="text-sm font-extrabold text-[#2D3B42]">
              Không tìm thấy KOC nào
            </p>
            <p className="mt-1 text-xs font-semibold text-[#8A7768]">
              Thử bỏ bớt bộ lọc hoặc từ khoá tìm kiếm.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <KocTableView
            items={filteredItems}
            onStatusChanged={() => setPage(1)}
            onView={(koc) => setViewingKoc(koc)}
          />
        ) : (
          <KocCardsView
            items={filteredItems}
            onStatusChanged={() => setPage(1)}
            onView={(koc) => setViewingKoc(koc)}
          />
        )}

        {/* Pagination bar consistent with project */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2D3B42]/10 px-5 py-3.5 text-xs text-[#8A7768] sm:px-6">
          <p className="font-semibold">
            Hiển thị{' '}
            <span className="font-bold text-[#2D3B42]">
              {total ? (page - 1) * 10 + 1 : 0}–{Math.min(page * 10, total)}
            </span>{' '}
            trên <span className="font-bold text-[#2D3B42]">{total}</span> KOC
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || query.isFetching}
              onClick={() => setPage(page - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/40 text-[#8A7768] ring-1 ring-[#2D3B42]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconChevron direction="left" className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono font-bold text-[#2D3B42] px-1">
              {page}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || query.isFetching}
              onClick={() => setPage(page + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/40 text-[#8A7768] ring-1 ring-[#2D3B42]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconChevron direction="right" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}

      {viewingKoc ? (
        <KocPreviewModal
          key={viewingKoc.id}
          koc={viewingKoc}
          onClose={() => setViewingKoc(null)}
        />
      ) : null}
    </section>
  );
}
