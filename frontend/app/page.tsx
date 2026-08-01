"use client";

import Link from "next/link";
import { RedSunNav } from "@/components/layout/red-sun-nav";
import { UiSimulator } from "@/components/ui/ui-simulator";
import { BentoFeatures } from "@/components/ui/bento-features";
import { MarqueeCards } from "@/components/ui/marquee-cards";
import { PricingSection } from "@/components/ui/pricing-section";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#2D3B42] text-white font-sans selection:bg-[#EF4623] selection:text-white">
      {/* Top Glassmorphism Navigation */}
      <RedSunNav />

      {/* Hero Section */}
      <section id="hero" className="relative pt-36 pb-24 md:pt-44 md:pb-32 overflow-hidden bg-white text-[#2D3B42]">
        {/* Large Ambient Blur Circles */}
        <div className="absolute top-10 right-10 w-[450px] h-[450px] bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none animate-ambient-blur" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none animate-ambient-blur" style={{ animationDelay: "4s" }} />

        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center relative z-10 space-y-8 animate-fade-up">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FDF1EE] border border-[#EF4623]/20 shadow-xs">
            <span className="text-[#EF4623] text-sm">✨</span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#EF4623]">
              Red Sun Design System • CRM-KOC Platform 3.0
            </span>
          </div>

          {/* Headline - Instrument Serif 60px to 160px */}
          <h1
            className="text-5xl sm:text-7xl md:text-[9rem] leading-[0.9] font-normal tracking-tight text-[#2D3B42]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Quản trị KOC <br />
            <span className="italic text-[#EF4623] block mt-1">Đỉnh cao Sáng tạo</span>
          </h1>

          {/* Subtext */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-[#2D3B42]/70 font-sans font-medium leading-relaxed">
            Giải pháp CRM chuyên sâu hỗ trợ Thương hiệu &amp; Creator quản lý chiến dịch, đối soát tự động và bứt phá doanh số Affiliate với trải nghiệm mượt mà vượt trội.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
            {/* Primary Pill Button with shadow-2xl */}
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-9 py-4 rounded-[30px] bg-[#EF4623] text-white font-bold text-sm uppercase tracking-wider shadow-2xl shadow-[#EF4623]/35 hover:bg-[#D83B19] hover:scale-105 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              Trải nghiệm Cổng Đăng nhập →
            </Link>

            {/* Secondary Ghost Button */}
            <a
              href="#value-prop"
              className="inline-flex items-center justify-center px-8 py-4 rounded-[30px] border-2 border-[#2D3B42]/15 text-[#2D3B42] font-extrabold text-sm uppercase tracking-wider hover:bg-[#2D3B42] hover:text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              Xem Demo UI
            </a>
          </div>

          {/* Hero Metrics Strip */}
          <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-slate-100">
            <div>
              <span
                className="text-4xl md:text-5xl font-normal text-[#2D3B42] block"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                15,000+
              </span>
              <span className="text-xs font-semibold text-slate-500">KOC đã xác thực</span>
            </div>
            <div>
              <span
                className="text-4xl md:text-5xl font-normal text-[#EF4623] italic block"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                1,200+
              </span>
              <span className="text-xs font-semibold text-slate-500">Nhãn hàng đồng hành</span>
            </div>
            <div>
              <span
                className="text-4xl md:text-5xl font-normal text-[#2D3B42] block"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                $45M+
              </span>
              <span className="text-xs font-semibold text-slate-500">GMV tạo ra 2025</span>
            </div>
            <div>
              <span
                className="text-4xl md:text-5xl font-normal text-[#EF4623] italic block"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                99.8%
              </span>
              <span className="text-xs font-semibold text-slate-500">Đối soát chính xác</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition (Bento Section with UI Simulator) */}
      <section id="value-prop" className="py-24 bg-[#FDF1EE] text-[#2D3B42] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Text-heavy with large Serif H2 and vertical feature list */}
            <ScrollReveal direction="left" delay={100} className="lg:col-span-6 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#EF4623] text-xs font-bold uppercase tracking-wider shadow-xs">
                <span>🔥 Red Sun Innovation</span>
              </div>

              <h2
                className="text-4xl sm:text-6xl font-normal tracking-tight text-[#2D3B42] leading-[1.05]"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Trải nghiệm điều hành <br />
                <span className="italic text-[#EF4623]">Hiện đại &amp; Tốc độ</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-700 font-sans leading-relaxed">
                Thiết kế Red Sun loại bỏ sự phức tạp cồng kềnh. Giao diện trực quan cho phép điều phối hàng trăm chiến dịch cùng lúc mà không bỏ lỡ bất kỳ KOC nào.
              </p>

              {/* Vertical Feature List using 56px rounded-2xl icon containers */}
              <div className="space-y-6">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#EF4623] text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-md shadow-[#EF4623]/30">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D3B42]">
                      Phân bổ Sample Siêu tốc
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">
                      Tự động duyệt địa chỉ nhận mẫu thử, xuất kho và đồng bộ trạng thái giao vận real-time.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#2D3B42] text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-md">
                    🎯
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D3B42]">
                      Theo dõi Doanh số Live Stream
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">
                      Cập nhật từng giây đơn hàng thành công trong suốt phiên chốt đơn của KOC.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white text-[#EF4623] border border-[#EF4623]/20 flex items-center justify-center text-xl font-bold shrink-0 shadow-xs">
                    🤝
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D3B42]">
                      Tự động hóa Hợp đồng &amp; Hoa hồng
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">
                      Ký điện tử tức thì và tính toán chi hoa hồng tự động theo từng cấp bậc KOC.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Right: UI Simulator Component */}
            <ScrollReveal direction="right" delay={250} className="lg:col-span-6">
              <UiSimulator />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <BentoFeatures />

      {/* Infinite Card Marquee with Alpha Mask */}
      <MarqueeCards />

      {/* Pricing & Dynamic Usage Calculator Section */}
      <PricingSection />

      {/* Call to Action Section - Solid #EF4623 64px (4rem) rounded container */}
      <section id="cta" className="py-20 px-4 sm:px-8 bg-[#2D3B42]">
        <ScrollReveal direction="rotate" delay={100}>
          <div className="max-w-7xl mx-auto bg-[#EF4623] rounded-[4rem] p-10 sm:p-16 md:p-24 relative overflow-hidden text-white shadow-2xl bg-dot-grid">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block px-5 py-2 bg-white/15 backdrop-blur-md rounded-full text-white text-xs font-extrabold uppercase tracking-widest border border-white/20">
              Sẵn sàng tăng trưởng GMV KOC?
            </div>

            <h2
              className="text-5xl sm:text-7xl md:text-8xl font-normal leading-none tracking-tight text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Bắt đầu chiến dịch KOC <br />
              <span className="italic underline underline-offset-8 decoration-white/40">
                chỉ trong 5 phút
              </span>
            </h2>

            <p className="text-base sm:text-xl text-white/90 font-sans max-w-2xl mx-auto leading-relaxed">
              Gia nhập hơn 1,200 nhãn hàng và 15,000 KOC đang sử dụng nền tảng CRM-KOC chuẩn Red Sun để tối đa hóa hiệu quả truyền thông.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-10 py-4 rounded-[30px] bg-white text-[#EF4623] font-extrabold text-sm uppercase tracking-wider shadow-2xl hover:bg-[#FDF1EE] hover:scale-105 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                Đăng nhập Cổng Hệ Thống
              </Link>
              <Link
                href="/brand/login"
                className="inline-flex items-center justify-center px-8 py-4 rounded-[30px] border-2 border-white/40 text-white font-extrabold text-sm uppercase tracking-wider hover:bg-white hover:text-[#EF4623] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                Dành cho Brand
              </Link>
            </div>

            {/* Trust-bar Footer */}
            <div className="pt-12 border-t border-white/20 text-xs uppercase tracking-widest font-bold text-white/80">
              ⚡ Được tin dùng bởi Vinamilk • Sunhouse • Coolmate • Lemonade • Anker • Baseus
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* Deep Ink Footer */}
      <footer className="bg-[#1E282D] text-slate-400 py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Column 1: Logo & Socials */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#EF4623] rounded-lg flex items-center justify-center transform rotate-3 shadow-md shadow-[#EF4623]/30">
                <span
                  className="text-white font-bold italic text-xl select-none"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  R
                </span>
              </div>
              <span
                className="text-2xl font-bold tracking-tight text-white"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                RedSun <span className="text-[#EF4623] italic">CRM</span>
              </span>
            </div>

            <p className="text-sm text-slate-400 font-sans max-w-sm leading-relaxed">
              Hệ thống quản trị hợp tác KOC &amp; Thương hiệu chuẩn Red Sun Editorial Design System. Tự động hóa chiến dịch, minh bạch dữ liệu và tối ưu hiệu suất Affiliate.
            </p>

            <div className="flex items-center gap-3">
              {["FB", "TT", "YT", "LI"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full border border-white/10 hover:border-[#EF4623] hover:text-[#EF4623] flex items-center justify-center text-xs font-bold transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-4">
            <h4
              className="text-xl font-normal text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Sản phẩm
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#value-prop" className="hover:text-white transition-colors">
                  AI Matching Engine
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Quản lý Mẫu thử
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Đối soát Hoa hồng
                </a>
              </li>
              <li>
                <a href="#value-prop" className="hover:text-white transition-colors">
                  Hợp đồng Điện tử
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals */}
          <div className="space-y-4">
            <h4
              className="text-xl font-normal text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Cổng Đăng Nhập
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/admin/login" className="hover:text-[#EF4623] transition-colors">
                  Cổng Quản trị Admin
                </Link>
              </li>
              <li>
                <Link href="/brand/login" className="hover:text-[#EF4623] transition-colors">
                  Cổng Doanh Nghiệp
                </Link>
              </li>
              <li>
                <Link href="/creator/login" className="hover:text-[#EF4623] transition-colors">
                  Cổng Creator / KOC
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#EF4623] transition-colors">
                  Tổng hợp Cổng Truy cập
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Contact */}
          <div className="space-y-4">
            <h4
              className="text-xl font-normal text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Liên hệ
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>Hotline: 1900 6868</li>
              <li>Email: contact@redsun-koc.vn</li>
              <li>Địa chỉ: Tòa nhà Red Sun Tower, Hà Nội</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Red Sun CRM-KOC System. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Điều khoản dịch vụ
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Sơ đồ trang
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
