import React from 'react';

export default function CreatorDashboard() {
  const stats = [
    { label: 'Followers tích lũy', value: '450K', change: 'Tiktok & Instagram', color: 'border-l-4 border-violet-500' },
    { label: 'Chiến dịch đã tham gia', value: '12', change: '8 chiến dịch hoàn thành', color: 'border-l-4 border-pink-500' },
    { label: 'Đang thực hiện', value: '2', change: 'Hạn nộp nháp: 3 ngày', color: 'border-l-4 border-amber-500' },
    { label: 'Thu nhập khả dụng', value: '$1,250', change: 'Đã rút: $4,800', color: 'border-l-4 border-emerald-500' },
  ];

  const jobs = [
    { brand: 'Glow Cosmetics', campaign: 'Môi xinh đón hè', budget: '$350', status: 'Cần nộp nháp', statusColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    { brand: 'Sneaker Head', campaign: 'Streetwear Walk', budget: '$500', status: 'Đang gửi mẫu thử', statusColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            Xin chào, Creator!
          </h2>
          <p className="text-slate-400 text-sm mt-1">Cập nhật hiệu suất kênh và quản lý các booking của bạn</p>
        </div>
        <button className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-violet-600/20 transition">
          Khám phá Chiến dịch mới
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

      {/* Jobs & Offers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Active Jobs */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Công việc đang thực hiện</h3>
          <div className="space-y-4">
            {jobs.map((j, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition">
                <div>
                  <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">{j.brand}</span>
                  <h4 className="font-bold text-slate-200 mt-1">{j.campaign}</h4>
                </div>
                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                  <span className="text-sm font-bold text-emerald-400">{j.budget}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${j.statusColor}`}>
                    {j.status}
                  </span>
                  <button className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition">
                    Chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Connect Social channels */}
        <div className="bg-slate-900/40 backdrop-blur border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Liên kết mạng xã hội</h3>
            <p className="text-xs text-slate-400 mb-6">Kết nối API để tự động đồng bộ hóa views, likes và followers</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                <span className="text-xs font-semibold text-slate-200">TikTok Channel</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">Đã liên kết</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                <span className="text-xs font-semibold text-slate-200">YouTube Channel</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-bold">Chưa liên kết</span>
              </div>
            </div>
          </div>
          <button className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 hover:border-slate-600 transition">
            Quản lý liên kết
          </button>
        </div>
      </div>
    </div>
  );
}
