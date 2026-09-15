'use client';

import { useMemo, useState } from 'react';
import { INITIAL_CAMPAIGNS, computeStats } from '../campaign-data';
import type { CampaignItem, CampaignStatus } from '../types';
import { CampaignStatsCards } from './campaign-stats';
import { CampaignFilterTabs } from './campaign-filter-tabs';
import { CampaignTableView } from './campaign-table-view';
import { CampaignDetailView } from './campaign-detail-view';
import { CampaignDecisionModal } from './campaign-decision-modal';

export function AdminCampaignList() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);
  const [currentTab, setCurrentTab] = useState<CampaignStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [viewingCampaign, setViewingCampaign] = useState<CampaignItem | null>(
    null
  );
  const [decisionModal, setDecisionModal] = useState<{
    campaign: CampaignItem;
    mode: 'approve' | 'reject';
  } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute stats based on current campaigns list
  const stats = useMemo(() => computeStats(campaigns), [campaigns]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<CampaignStatus, number> = {
      all: campaigns.length,
      pending: campaigns.filter((c) => c.status === 'pending').length,
      active: campaigns.filter((c) => c.status === 'active').length,
      paused: campaigns.filter((c) => c.status === 'paused').length,
      overdue: campaigns.filter((c) => c.status === 'overdue').length,
      rejected: campaigns.filter((c) => c.status === 'rejected').length,
      completed: campaigns.filter((c) => c.status === 'completed').length,
    };
    return counts;
  }, [campaigns]);

  // Filter & Search
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Tab filter
      if (currentTab !== 'all' && c.status !== currentTab) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = c.title.toLowerCase().includes(query);
        const matchBrand = c.brandName.toLowerCase().includes(query);
        const matchPlatform = c.platforms.some((p) =>
          p.toLowerCase().includes(query)
        );
        return matchTitle || matchBrand || matchPlatform;
      }
      return true;
    });
  }, [campaigns, currentTab, searchQuery]);

  // Handle Approve / Reject
  const handleConfirmDecision = (
    campaignId: string,
    action: 'approve' | 'reject',
    reason?: string
  ) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        if (action === 'approve') {
          return {
            ...c,
            status: 'active' as const,
          };
        } else {
          return {
            ...c,
            status: 'rejected' as const,
            description: reason
              ? `${c.description || ''} (Lý do từ chối: ${reason})`
              : c.description,
          };
        }
      })
    );

    if (action === 'approve') {
      showToast('Đã duyệt chiến dịch thành công! Chiến dịch hiện đang chạy.');
    } else {
      showToast('Đã từ chối chiến dịch thành công.');
    }
  };

  const handleStatusChange = (
    campaignId: string,
    newStatus: CampaignItem['status']
  ) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: newStatus } : c))
    );
    if (viewingCampaign && viewingCampaign.id === campaignId) {
      setViewingCampaign((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
    }
    showToast(
      newStatus === 'paused'
        ? 'Đã chuyển trạng thái chiến dịch sang Tạm dừng.'
        : newStatus === 'rejected'
        ? 'Đã hủy chiến dịch.'
        : 'Đã cập nhật trạng thái chiến dịch.'
    );
  };

  // If viewing campaign in full view mode, show CampaignDetailView
  if (viewingCampaign) {
    return (
      <div className="space-y-6 pb-12">
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-[#2D3B42] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {toastMessage}
          </div>
        )}
        <CampaignDetailView
          campaign={viewingCampaign}
          onBack={() => setViewingCampaign(null)}
          onStatusChange={handleStatusChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#2D3B42] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* 4 Stats Cards */}
      <CampaignStatsCards stats={stats} />

      {/* Filter Tabs & Search */}
      <CampaignFilterTabs
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        counts={tabCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Table of Campaigns */}
      <CampaignTableView
        campaigns={filteredCampaigns}
        onViewDetail={(campaign) => setViewingCampaign(campaign)}
        onApprove={(campaign) =>
          setDecisionModal({ campaign, mode: 'approve' })
        }
        onReject={(campaign) => setDecisionModal({ campaign, mode: 'reject' })}
      />

      {/* Modal Decision (Approve / Reject) */}
      <CampaignDecisionModal
        campaign={decisionModal?.campaign ?? null}
        mode={decisionModal?.mode ?? null}
        onClose={() => setDecisionModal(null)}
        onConfirm={handleConfirmDecision}
      />
    </div>
  );
}
