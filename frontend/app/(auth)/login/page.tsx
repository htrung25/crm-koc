"use client";

import Link from "next/link";

export default function LoginPage() {
  const portals = [
    {
      role: "ADMIN",
      title: "KOC CRM ADMIN",
      desc: "Cổng đăng nhập bảo mật dành riêng cho Quản trị viên hệ thống.",
      href: "/admin/login",
      icon: "⚡",
      badge: "Cổng Admin",
      btnClass: "from-[#6C4CF1] to-[#9B6CF5] hover:opacity-95 shadow-[#6C4CF1]/30",
      accentBorder: "border-[#6C4CF1]/40"
    },
    {
      role: "BRAND",
      title: "BRAND PORTAL",
      desc: "Cổng thông tin & tạo chiến dịch dành cho Doanh nghiệp & Nhãn hàng.",
      href: "/brand/login",
      icon: "🏢",
      badge: "Cổng Doanh nghiệp",
      btnClass: "from-pink-600 to-amber-600 hover:from-pink-500 hover:to-amber-500 shadow-pink-600/30",
      accentBorder: "border-pink-500/40"
    },
    {
      role: "CREATOR",
      title: "CREATOR SPACE",
      desc: "Không gian làm việc, nhận job & quản lý thu nhập cho KOC / KOL.",
      href: "/creator/login",
      icon: "✨",
      badge: "Cổng Creator / KOC",
      btnClass: "from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-violet-600/30",
      accentBorder: "border-violet-500/40"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black text-white p-4 font-sans">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            CRM-KOC Platform
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Vui lòng lựa chọn Cổng đăng nhập tương ứng với Vai trò của bạn trên hệ thống
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portals.map((p) => (
            <div
              key={p.role}
              className={`flex flex-col justify-between rounded-3xl bg-slate-900/60 backdrop-blur-xl border ${p.accentBorder} p-6 shadow-2xl transition hover:-translate-y-1 hover:border-white/40`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{p.icon}</span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-300">
                    {p.badge}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{p.title}</h2>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href={p.href}
                  className={`block w-full py-3 text-center bg-gradient-to-r ${p.btnClass} text-white font-extrabold rounded-xl shadow-lg transition text-xs`}
                >
                  Truy cập Cổng Đăng nhập
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
