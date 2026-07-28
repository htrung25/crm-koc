import React from 'react';

export default function BrandDashboard() {
  const stats = [
    { label: 'Chiến dịch Hoạt động', value: '4', change: 'Tổng ngân sách: $15,000', color: 'border-l-4 border-violet-500' },
    { label: 'KOC đang làm việc', value: '18', change: '5 yêu cầu phê duyệt nháp', color: 'border-l-4 border-pink-500' },
    { label: 'Số video thu về', value: '32', change: '+12 video tuần này', color: 'border-l-4 border-amber-500' },
    { label: 'ROI Trung Bình', value: '3.4x', change: 'Dựa trên conversions liên kết', color: 'border-l-4 border-emerald-500' },
  ];

  const campaigns = [
    { title: 'Môi xinh đón hè', budget: '$5,000', applies: '24 KOC ứng tuyển', status: 'ACTIVE', statusColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    { title: 'Review Sneaker 2026', budget: '$10,000', applies: '8 KOC ứng tuyển', status: 'PENDING_APPROVAL', statusColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 to-amber-300 bg-clip-text text-transparent">
            Brand Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-1">Quản lý các chiến dịch KOC và theo dõi hiệu suất bán hàng</p>
        </div>
        <button className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-pink-600/20 transition">
          Tạo Chiến Dịch Mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <div key={idx} className={`bg-slate-900/40 backdrop-blur border border-slate-800 p-6 rounded-2xl ${s.color} hover:border-slate-700 transition`}>
            <span className="text-xs text-slate-400 font-medium block">{s.label}</span>
            <span className="text-3xl font-bold tracking-tight text-white block mt-2">{s.value}</span>
            <span className="text-[11px] text-slate-500 block mt-2">{s.change}</span>
          </div>
        ))}
      </div>

      {/* Campaign List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Active Campaigns */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Chiến dịch của bạn</h3>
          <div className="space-y-4">
            {campaigns.map((c, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition">
                <div>
                  <h4 className="font-bold text-slate-200">{c.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">Ngân sách: {c.budget} | {c.applies}</p>
                </div>
                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.statusColor}`}>
                    {c.status}
                  </span>
                  <button className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition">
                    Quản lý KOC
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="bg-slate-900/40 backdrop-blur border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Việc cần làm ngay</h3>
          <div className="space-y-4">
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-200">5 KOC nộp video nháp</p>
                <p className="text-[10px] text-slate-400">Cần duyệt trước ngày mai</p>
              </div>
              <button className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded text-[10px] transition">
                Duyệt
              </button>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-200">2 Deal đã hoàn thành</p>
                <p className="text-[10px] text-slate-400">Chờ giải ngân thanh toán</p>
              </div>
              <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] transition">
                Trả phí
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
