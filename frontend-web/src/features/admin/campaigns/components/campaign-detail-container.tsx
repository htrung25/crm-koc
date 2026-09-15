'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import type { CampaignItem } from '../types';
import { CampaignDetailView } from './campaign-detail-view';

export function CampaignDetailContainer({
  initialCampaign,
}: {
  initialCampaign: CampaignItem;
}) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignItem>(initialCampaign);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStatusChange = (
    _campaignId: string,
    newStatus: CampaignItem['status']
  ) => {
    setCampaign((prev) => ({ ...prev, status: newStatus }));
    showToast(
      newStatus === 'paused'
        ? 'Đã chuyển trạng thái chiến dịch sang Tạm dừng.'
        : newStatus === 'rejected'
        ? 'Đã hủy chiến dịch.'
        : 'Đã cập nhật trạng thái chiến dịch.'
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#2D3B42] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {toastMessage}
        </div>
      )}
      <CampaignDetailView
        campaign={campaign}
        onBack={() => router.push(APP_ROUTES.admin.campaigns)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
