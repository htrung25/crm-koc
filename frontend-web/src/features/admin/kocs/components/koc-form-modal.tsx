'use client';

import { useState } from 'react';
import type { KocItem, KocStatus } from '../types';

type KocFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (koc: Partial<KocItem>) => void;
  initialData?: KocItem | null;
};

function KocFormModalContent({
  onClose,
  onSave,
  initialData,
}: Omit<KocFormModalProps, 'isOpen'>) {
  const initialTikTok = initialData?.followers.find(
    (f) => f.platform === 'TikTok'
  );
  const initialTikTokEr = initialData?.engagement.find(
    (e) => e.platform === 'TikTok'
  );
  const initialInstagram = initialData?.followers.find(
    (f) => f.platform === 'Instagram'
  );
  const initialInstagramEr = initialData?.engagement.find(
    (e) => e.platform === 'Instagram'
  );

  const [name, setName] = useState(initialData?.name ?? '');
  const [handle, setHandle] = useState(initialData?.handle ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'Làm đẹp');
  const [status, setStatus] = useState<KocStatus>(
    initialData?.status ?? 'active'
  );
  const [tikTokCount, setTikTokCount] = useState(initialTikTok?.count ?? '');
  const [tikTokEr, setTikTokEr] = useState(initialTikTokEr?.rate ?? '');
  const [instagramCount, setInstagramCount] = useState(
    initialInstagram?.count ?? ''
  );
  const [instagramEr, setInstagramEr] = useState(
    initialInstagramEr?.rate ?? ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim()) return;

    const followers = [];
    if (tikTokCount.trim()) {
      followers.push({
        platform: 'TikTok' as const,
        count: tikTokCount.trim(),
      });
    }
    if (instagramCount.trim()) {
      followers.push({
        platform: 'Instagram' as const,
        count: instagramCount.trim(),
      });
    }

    const engagement = [];
    if (tikTokEr.trim()) {
      engagement.push({ platform: 'TikTok' as const, rate: tikTokEr.trim() });
    }
    if (instagramEr.trim()) {
      engagement.push({
        platform: 'Instagram' as const,
        rate: instagramEr.trim(),
      });
    }

    onSave({
      id: initialData?.id,
      name: name.trim(),
      handle: handle.startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      category,
      status,
      followers: followers.length
        ? followers
        : [{ platform: 'TikTok', count: '100K' }],
      engagement: engagement.length
        ? engagement
        : [{ platform: 'TikTok', rate: '5.0%' }],
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] glass bg-[#FAF7F2]/95 p-6 sm:p-7 shadow-2xl ring-1 ring-white/60">
        <div className="flex items-start justify-between gap-4 border-b border-[#2D3B42]/10 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-[#2D3B42]">
              {initialData ? 'Chỉnh sửa KOC' : 'Thêm KOC mới'}
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-[#8A7768]">
              {initialData
                ? 'Cập nhật thông tin kênh và chỉ số tương tác KOC.'
                : 'Điền thông tin tài khoản KOC để thêm vào hệ thống quản trị.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-[#8A7768] hover:bg-white/80 hover:text-[#2D3B42]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#5C5049]">
                Họ và tên *
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Mai Anh"
                className="h-11 w-full rounded-xl bg-white/70 px-3.5 text-sm font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/12 focus:ring-2 focus:ring-[#EF4623]/40"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#5C5049]">
                Handle / Kênh *
              </span>
              <input
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@maianh.beauty"
                className="h-11 w-full rounded-xl bg-white/70 px-3.5 text-sm font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/12 focus:ring-2 focus:ring-[#EF4623]/40"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#5C5049]">
                Lĩnh vực
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-xl bg-white/70 px-3 text-sm font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/12 focus:ring-2 focus:ring-[#EF4623]/40"
              >
                <option value="Làm đẹp">Làm đẹp</option>
                <option value="Đời sống">Đời sống</option>
                <option value="Thời trang">Thời trang</option>
                <option value="Công nghệ">Công nghệ</option>
                <option value="Game">Game</option>
                <option value="Thể hình">Thể hình</option>
                <option value="Ẩm thực">Ẩm thực</option>
                <option value="Du lịch">Du lịch</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#5C5049]">
                Trạng thái
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as KocStatus)}
                className="h-11 w-full rounded-xl bg-white/70 px-3 text-sm font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/12 focus:ring-2 focus:ring-[#EF4623]/40"
              >
                <option value="active">Đang hợp tác</option>
                <option value="pending">Chờ duyệt</option>
                <option value="suspended">Tạm dừng</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl bg-white/50 p-3.5 ring-1 ring-[#2D3B42]/8 space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#8A7768]">
              Chỉ số nền tảng
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-[#5C5049]">
                  TikTok Follower
                </span>
                <input
                  type="text"
                  value={tikTokCount}
                  onChange={(e) => setTikTokCount(e.target.value)}
                  placeholder="800K"
                  className="h-9 w-full rounded-lg bg-white px-2.5 text-xs font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/30"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-[#5C5049]">
                  TikTok ER (%)
                </span>
                <input
                  type="text"
                  value={tikTokEr}
                  onChange={(e) => setTikTokEr(e.target.value)}
                  placeholder="9.2%"
                  className="h-9 w-full rounded-lg bg-white px-2.5 text-xs font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/30"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-[#5C5049]">
                  Instagram Follower
                </span>
                <input
                  type="text"
                  value={instagramCount}
                  onChange={(e) => setInstagramCount(e.target.value)}
                  placeholder="400K"
                  className="h-9 w-full rounded-lg bg-white px-2.5 text-xs font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/30"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-[#5C5049]">
                  Instagram ER (%)
                </span>
                <input
                  type="text"
                  value={instagramEr}
                  onChange={(e) => setInstagramEr(e.target.value)}
                  placeholder="6.8%"
                  className="h-9 w-full rounded-lg bg-white px-2.5 text-xs font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/30"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#2D3B42]/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#5C5049] hover:bg-white/80"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-br from-[#EF4623] to-[#D8410F] px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#EF4623]/25 transition-all hover:shadow-lg hover:shadow-[#EF4623]/35 active:scale-[0.98]"
            >
              {initialData ? 'Lưu thay đổi' : 'Thêm KOC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function KocFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: KocFormModalProps) {
  if (!isOpen) return null;

  return (
    <KocFormModalContent
      key={initialData?.id ?? 'new'}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
    />
  );
}
