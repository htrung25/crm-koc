"use client";

import { useMemo, useState } from "react";
import {
  IconChevron,
  IconPlus,
  IconSearch,
} from "@/components/ui/icons";
import { MOCK_KOCS } from "../mock-data";
import type {
  KocFilterStatus,
  KocItem,
  KocViewMode,
} from "../types";
import { KocTableView } from "./koc-table-view";
import { KocCardsView } from "./koc-cards-view";
import { KocFormModal } from "./koc-form-modal";
import { KocDetailModal } from "./koc-detail-modal";

const FILTER_TABS: { key: KocFilterStatus; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang hợp tác" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "suspended", label: "Tạm dừng" },
];

const CATEGORIES = [
  "Tất cả",
  "Làm đẹp",
  "Đời sống",
  "Thời trang",
  "Công nghệ",
  "Game",
  "Thể hình",
  "Ẩm thực",
  "Du lịch",
];

export function AdminKocList() {
  const [items, setItems] = useState<KocItem[]>(MOCK_KOCS);
  const [viewMode, setViewMode] = useState<KocViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<KocFilterStatus>("all");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKoc, setEditingKoc] = useState<KocItem | null>(null);
  const [viewingKoc, setViewingKoc] = useState<KocItem | null>(null);

  // Filter logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (
        selectedCategory !== "Tất cả" &&
        item.category !== selectedCategory
      ) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(term);
        const matchHandle = item.handle.toLowerCase().includes(term);
        const matchCategory = item.category.toLowerCase().includes(term);
        if (!matchName && !matchHandle && !matchCategory) {
          return false;
        }
      }
      return true;
    });
  }, [items, statusFilter, selectedCategory, searchTerm]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    return {
      all: items.length,
      active: items.filter((k) => k.status === "active").length,
      pending: items.filter((k) => k.status === "pending").length,
      suspended: items.filter((k) => k.status === "suspended").length,
    };
  }, [items]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingKoc(null);
    setIsFormOpen(true);
  };

  const handleEdit = (koc: KocItem) => {
    setEditingKoc(koc);
    setIsFormOpen(true);
  };

  const handleDelete = (koc: KocItem) => {
    if (window.confirm(`Xoá hồ sơ KOC "${koc.name}" khỏi hệ thống?`)) {
      setItems((prev) => prev.filter((i) => i.id !== koc.id));
    }
  };

  const handleSave = (saved: Partial<KocItem>) => {
    if (saved.id) {
      // Update
      setItems((prev) =>
        prev.map((item) =>
          item.id === saved.id ? ({ ...item, ...saved } as KocItem) : item
        )
      );
    } else {
      // Create new
      const newItem: KocItem = {
        id: `koc-${Date.now()}`,
        name: saved.name || "KOC Mới",
        handle: saved.handle || "@newkoc",
        initials: (saved.name || "NK")
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
        avatarGradient: "from-[#EF4623] to-[#F49E4C]",
        followers: saved.followers || [{ platform: "TikTok", count: "50K" }],
        engagement: saved.engagement || [{ platform: "TikTok", rate: "4.5%" }],
        category: saved.category || "Làm đẹp",
        campaigns: 1,
        revenue: "10M",
        status: saved.status || "active",
      };
      setItems((prev) => [newItem, ...prev]);
    }
  };

  return (
    <section className="space-y-4">
      {/* Top Header Section matching Mockup */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#2D3B42]">
            Danh sách KOC
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-[#8A7768]">
            Quản lý toàn bộ KOC/KOL đang hợp tác.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle: Bảng / Thẻ */}
          <div className="inline-flex rounded-2xl bg-white/70 p-1 ring-1 ring-[#2D3B42]/10 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-white text-[#2D3B42] shadow-xs ring-1 ring-[#2D3B42]/5 font-extrabold"
                  : "text-[#8A7768] hover:text-[#2D3B42]"
              }`}
            >
              Bảng
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                viewMode === "cards"
                  ? "bg-white text-[#2D3B42] shadow-xs ring-1 ring-[#2D3B42]/5 font-extrabold"
                  : "text-[#8A7768] hover:text-[#2D3B42]"
              }`}
            >
              Thẻ
            </button>
          </div>

          {/* Primary CTA: + Thêm KOC */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#EF4623] to-[#D8410F] px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#EF4623]/25 transition-all hover:shadow-lg hover:shadow-[#EF4623]/35 active:scale-[0.98]"
          >
            <IconPlus className="h-4 w-4" />
            <span>Thêm KOC</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs matching mockup */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {FILTER_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          const count = tabCounts[tab.key];

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition-all duration-200 ${
                isActive
                  ? "border-2 border-[#EF4623] bg-[#EF4623]/10 text-[#EF4623] shadow-xs"
                  : "border border-transparent bg-white/70 text-[#5C5049] hover:bg-white hover:text-[#2D3B42] ring-1 ring-[#2D3B42]/8"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  isActive
                    ? "bg-[#EF4623] text-white"
                    : "bg-[#2D3B42]/8 text-[#8A7768]"
                }`}
              >
                {count}
              </span>
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
                placeholder="Tìm theo tên, handle, lĩnh vực…"
                className="h-full w-full bg-transparent text-sm font-semibold text-[#2D3B42] outline-none placeholder:font-medium placeholder:text-[#8A7768]/70"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
              Lĩnh vực
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-12 w-full rounded-2xl bg-white/65 px-4 text-sm font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Main Content: Table or Cards View */}
      <div className="glass overflow-hidden rounded-[26px]">
        {filteredItems.length === 0 ? (
          <div className="px-5 py-14 text-center sm:px-6">
            <p className="text-sm font-extrabold text-[#2D3B42]">
              Không tìm thấy KOC nào
            </p>
            <p className="mt-1 text-xs font-semibold text-[#8A7768]">
              Thử bỏ bớt bộ lọc hoặc từ khoá tìm kiếm.
            </p>
          </div>
        ) : viewMode === "table" ? (
          <KocTableView
            items={filteredItems}
            onView={(koc) => setViewingKoc(koc)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <KocCardsView
            items={filteredItems}
            onView={(koc) => setViewingKoc(koc)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Pagination bar consistent with project */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2D3B42]/10 px-5 py-3.5 text-xs text-[#8A7768] sm:px-6">
          <p className="font-semibold">
            Hiển thị <span className="font-bold text-[#2D3B42]">1–{filteredItems.length}</span> trên{" "}
            <span className="font-bold text-[#2D3B42]">{filteredItems.length}</span> KOC
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/40 text-[#8A7768] ring-1 ring-[#2D3B42]/10 opacity-50 cursor-not-allowed"
            >
              <IconChevron direction="left" className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono font-bold text-[#2D3B42] px-1">1</span>
            <button
              type="button"
              disabled
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/40 text-[#8A7768] ring-1 ring-[#2D3B42]/10 opacity-50 cursor-not-allowed"
            >
              <IconChevron direction="right" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <KocFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        initialData={editingKoc}
      />

      <KocDetailModal
        koc={viewingKoc}
        onClose={() => setViewingKoc(null)}
        onEdit={handleEdit}
      />
    </section>
  );
}
