"use client";

import Link from "next/link";
import { RedSunNav } from "@/components/layout/red-sun-nav";

export default function LoginPage() {
  const portals = [
    {
      role: "ADMIN",
      title: "CỔNG ADMIN HỆ THỐNG",
      desc: "Không gian quản trị tối cao dành cho Ban quản trị Red Sun CRM. Quản lý toàn bộ dữ liệu KOC & Nhãn hàng.",
      href: "/admin/login",
      icon: "⚡",
      badge: "Cổng Bảo Mật",
      btnText: "Đăng nhập Admin",
      pillBg: "bg-[#EF4623]",
      borderHover: "hover:border-[#EF4623]"
    },
    {
      role: "BRAND",
      title: "CỔNG DOANH NGHIỆP",
      desc: "Dành cho Doanh nghiệp & Nhãn hàng khởi tạo chiến dịch KOC, gửi sample sản phẩm và theo dõi doanh số.",
      href: "/brand/login",
      icon: "🏢",
      badge: "Cổng Brand",
      btnText: "Đăng nhập Brand",
      pillBg: "bg-[#2D3B42] dark:bg-[#EF4623]",
      borderHover: "hover:border-[#EF4623]"
    },
    {
      role: "CREATOR",
      title: "CỔNG CREATOR / KOC",
      desc: "Không gian dành riêng cho KOC / KOL nhận Job, đăng ký nhận sản phẩm trải nghiệm và rút hoa hồng.",
      href: "/creator/login",
      icon: "✨",
      badge: "Cổng KOC",
      btnText: "Đăng nhập KOC",
      pillBg: "bg-[#EF4623]",
      borderHover: "hover:border-[#EF4623]"
    }
  ];

  return (
    <div className="min-h-screen bg-[#2D3B42] text-white font-sans selection:bg-[#EF4623] selection:text-white flex flex-col justify-between relative overflow-hidden">
      {/* Top Glassmorphism Navigation */}
      <RedSunNav />

      {/* Ambient background blur circles */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#EF4623]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-[#EF4623]/15 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-20 relative z-10">
        <div className="w-full max-w-5xl space-y-12 animate-fade-up">
          {/* Header Section */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDF1EE] text-[#EF4623] text-xs font-bold uppercase tracking-widest shadow-sm">
              <span>🔒 Red Sun Secure Gateways</span>
            </div>

            <h1
              className="text-4xl sm:text-6xl font-normal tracking-tight text-white leading-tight"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Hệ thống Cổng Đăng Nhập <br />
              <span className="italic text-[#EF4623]">CRM-KOC Platform</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base font-sans leading-relaxed">
              Vui lòng lựa chọn Cổng đăng nhập tương ứng với vai trò của bạn trên nền tảng Red Sun.
            </p>
          </div>

          {/* 3 Portals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {portals.map((p) => (
              <div
                key={p.role}
                className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-[30px] p-8 flex flex-col justify-between shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 ${p.borderHover}`}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#FDF1EE] text-[#EF4623] flex items-center justify-center text-2xl font-bold shadow-sm">
                      {p.icon}
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-200">
                      {p.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2
                      className="text-2xl font-normal text-white"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      {p.title}
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {p.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <Link
                    href={p.href}
                    className="block w-full py-3.5 text-center bg-[#EF4623] text-white font-bold rounded-[30px] text-xs uppercase tracking-wider shadow-lg shadow-[#EF4623]/30 hover:bg-[#D83B19] hover:scale-105 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    {p.btnText} →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Return Home Link */}
          <div className="text-center pt-4">
            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors underline underline-offset-4"
            >
              ← Quay lại Trang Chủ Red Sun
            </Link>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-white/5 relative z-10">
        © 2026 Red Sun Editorial Design System. Protected Gateway.
      </footer>
    </div>
  );
}
