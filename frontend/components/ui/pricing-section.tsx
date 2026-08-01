"use client";

import { useState } from "react";
import Link from "next/link";

interface PricingCardProps {
  title: string;
  subtitle: string;
  price?: string;
  priceDetail?: string;
  buttonText: string;
  buttonVariant?: "primary" | "secondary" | "outline";
  highlight?: boolean;
  badge?: string;
  sublinkText?: string;
  features: string[];
}

export function PricingSection() {
  const [events, setEvents] = useState<number>(10); // Volume slider (1K to 100K orders/month)
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  // Dynamic pricing formula
  const calculatePrice = (val: number) => {
    // Base unit price per 1K orders
    const base = val * 190000;
    const finalPrice = period === "yearly" ? base * 0.8 : base;
    return new Intl.NumberFormat("vi-VN").format(Math.round(finalPrice));
  };

  const getPerUnitRate = (val: number) => {
    const rate = period === "yearly" ? 152 : 190;
    return rate;
  };

  return (
    <section id="pricing" className="py-24 bg-[#2D3B42] text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#EF4623]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#EF4623]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-5 mb-16">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-5 py-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-[#EF4623] border-2 border-[#2D3B42] flex items-center justify-center font-bold text-[10px] text-white"
                >
                  K{i}
                </div>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-200">
              Được tin dùng bởi 1,200+ Nhãn hàng &amp; 15,000+ KOC
            </span>
          </div>

          <h2
            className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white leading-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Bảng giá minh bạch &amp; <br />
            <span className="italic text-[#EF4623]">Tăng trưởng cùng Doanh nghiệp</span>
          </h2>

          <p className="text-slate-300 font-sans text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Lựa chọn gói dịch vụ tối ưu ngân sách cho Creator cá nhân hoặc chiến dịch Mega Live Stream của Nhãn hàng lớn.
          </p>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20 items-stretch">
          {/* Card 1: Free Starter */}
          <div className="bg-white/95 text-[#2D3B42] rounded-[30px] p-8 border border-white/10 shadow-2xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-2">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Dành cho KOC Mới
                </span>
                <h3
                  className="text-3xl font-normal text-[#2D3B42]"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  KOC Starter
                </h3>
                <p className="text-xs text-slate-500 mt-2 min-h-[36px]">
                  Miễn phí vĩnh viễn. Đầy đủ tính năng tạo hồ sơ cá nhân và nhận deal sản phẩm.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-4xl font-extrabold text-[#2D3B42]">0 VNĐ</span>
                <span className="text-xs text-slate-400 font-medium block mt-1">
                  Miễn phí vĩnh viễn
                </span>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 font-medium pt-2">
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Quản lý tối đa 5 chiến dịch/tháng
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Tự động tạo link Affiliate TikTok &amp; Shopee
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Đăng ký nhận 10 mẫu thử free/tháng
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Báo cáo doanh thu rút hoa hồng hàng tháng
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-6">
              <Link
                href="/register"
                className="block w-full py-3.5 text-center bg-[#2D3B42] text-white font-bold rounded-[30px] text-xs uppercase tracking-wider shadow-md hover:bg-[#EF4623] transition-colors"
              >
                Đăng Ký Miễn Phí →
              </Link>
            </div>
          </div>

          {/* Card 2: Growth (Highlighted Card) */}
          <div className="bg-white text-[#2D3B42] rounded-[30px] p-8 md:p-9 border-2 border-[#EF4623] shadow-2xl shadow-[#EF4623]/25 flex flex-col justify-between relative transform md:-translate-y-4 z-10 transition-all duration-500 hover:-translate-y-6">
            {/* Highlight Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#EF4623] text-white text-[11px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
              🔥 Khuyên Dùng Cho Brand
            </div>

            <div className="space-y-6 pt-2">
              <div>
                <span className="text-xs font-bold text-[#EF4623] uppercase tracking-wider block mb-1">
                  Doanh Nghiệp &amp; Agency
                </span>
                <h3
                  className="text-3xl sm:text-4xl font-normal text-[#2D3B42]"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Growth Engine
                </h3>
                <p className="text-xs text-slate-600 mt-2 min-h-[36px]">
                  Bứt phá doanh số cho thương hiệu với AI Matching KOC &amp; tự động hóa Seeding sample.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-[#2D3B42]">
                    1.990.000
                  </span>
                  <span className="text-xs font-bold text-slate-500">VNĐ/tháng</span>
                </div>
                <span className="text-xs text-[#EF4623] font-bold block mt-1">
                  Miễn phí 1M lượt click Affiliate đầu tiên
                </span>
              </div>

              <ul className="space-y-3 text-xs text-slate-700 font-semibold pt-2">
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> AI Matching tự động 50 KOC chất lượng cao/tháng
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Tự động hóa duyệt địa chỉ &amp; gửi Sample 1-Click
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Hợp đồng điện tử ký số tích hợp sẵn
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Tracking doanh số Mega Live Stream Real-time
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Hỗ trợ đối soát ưu tiên 24/7
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-6 space-y-3">
              <Link
                href="/brand/login"
                className="block w-full py-4 text-center bg-[#EF4623] text-white font-extrabold rounded-[30px] text-xs uppercase tracking-wider shadow-xl shadow-[#EF4623]/35 hover:bg-[#D83B19] hover:scale-105 transition-all"
              >
                Dùng Thử 14 Ngày Miễn Phí →
              </Link>
              <a
                href="#calculator"
                className="block text-center text-xs font-bold text-slate-500 hover:text-[#EF4623] underline underline-offset-4 transition-colors"
              >
                Ước tính chi phí theo sản phẩm ↓
              </a>
            </div>
          </div>

          {/* Card 3: Enterprise */}
          <div className="bg-white/95 text-[#2D3B42] rounded-[30px] p-8 border border-white/10 shadow-2xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-2">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Quy mô Tập Đoàn
                </span>
                <h3
                  className="text-3xl font-normal text-[#2D3B42]"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Enterprise
                </h3>
                <p className="text-xs text-slate-500 mt-2 min-h-[36px]">
                  Hệ thống tùy chỉnh chuyên sâu dành cho các thương hiệu lớn điều hành hàng nghìn KOC.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-3xl font-extrabold text-[#2D3B42]">Liên Hệ Tư Vấn</span>
                <span className="text-xs text-slate-400 font-medium block mt-1">
                  Thiết kế hạ tầng theo yêu cầu
                </span>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 font-medium pt-2">
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Không giới hạn số lượng KOC &amp; Chiến dịch
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Tích hợp API riêng với hệ thống ERP / SAP / CRM
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Dedicated Server riêng đạt chuẩn ISO 27001
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#EF4623] font-bold">✓</span> Key Account Manager hỗ trợ vận hành trực tiếp
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-6">
              <Link
                href="/admin/login"
                className="block w-full py-3.5 text-center bg-[#2D3B42] text-white font-bold rounded-[30px] text-xs uppercase tracking-wider shadow-md hover:bg-[#EF4623] transition-colors"
              >
                Liên Hệ Đội Ngũ Sales →
              </Link>
            </div>
          </div>
        </div>

        {/* Startups & KOC Special Offer Banner */}
        <div className="max-w-4xl mx-auto my-16 bg-[#FDF1EE] text-[#2D3B42] rounded-[30px] p-8 sm:p-10 border border-[#EF4623]/20 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="inline-block px-3 py-1 bg-[#EF4623] text-white text-[10px] font-extrabold uppercase tracking-widest rounded-full">
              Ưu Đãi Đặc Biệt
            </span>
            <h3
              className="text-2xl sm:text-3xl font-normal text-[#2D3B42]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Startup &amp; KOC Mới: <span className="italic text-[#EF4623]">Miễn phí 1 năm đầu tiên</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-sans max-w-xl">
              Các thương hiệu dưới 3 năm thành lập hoặc Creator đạt trên 2,000 Followers được tài trợ 100% chi phí sử dụng gói Growth năm đầu.
            </p>
          </div>

          <Link
            href="/register"
            className="shrink-0 px-6 py-3.5 rounded-[30px] bg-[#2D3B42] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#EF4623] transition-colors"
          >
            Đăng Ký Ưu Đãi →
          </Link>
        </div>

        {/* DYNAMIC USAGE CALCULATOR SECTION */}
        <div id="calculator" className="pt-12">
          <div className="max-w-xl mx-auto text-center mb-10 space-y-3">
            <h3
              className="text-4xl sm:text-5xl font-normal text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Công cụ tính phí <span className="text-[#EF4623] italic">Linh hoạt</span>
            </h3>
            <p className="text-slate-300 text-sm font-sans">
              Kéo thanh trượt để ước tính chi phí quản lý chiến dịch theo số lượng đơn hàng / mẫu thử phát hành mỗi tháng.
            </p>
          </div>

          {/* Calculator Card Container */}
          <div className="w-full max-w-4xl mx-auto p-8 sm:p-12 rounded-[40px] bg-[#1E282D] border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Ambient Coral Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-full bg-[#EF4623]/10 blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center justify-between">
              {/* Left Side: Period Toggle & Calculated Price Display */}
              <div className="flex-1 space-y-6 w-full text-center md:text-left">
                <div className="inline-flex bg-[#2D3B42] p-1.5 rounded-full border border-white/10">
                  <button
                    onClick={() => setPeriod("monthly")}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                      period === "monthly"
                        ? "bg-[#EF4623] text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Hàng Tháng
                  </button>
                  <button
                    onClick={() => setPeriod("yearly")}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                      period === "yearly"
                        ? "bg-[#EF4623] text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Hàng Năm (-20%)
                  </button>
                </div>

                <div>
                  <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <span className="text-4xl sm:text-6xl font-bold tracking-tight text-white">
                      {calculatePrice(events)}
                    </span>
                    <span className="text-slate-400 font-sans text-sm">VNĐ / tháng</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-mono">
                    ~ {getPerUnitRate(events)} VNĐ / đơn hàng thành công ({events}K đơn/tháng)
                  </p>
                </div>
              </div>

              {/* Right Side: Range Slider */}
              <div className="flex-1 w-full space-y-8 bg-[#2D3B42] p-6 sm:p-8 rounded-3xl border border-white/5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-300">Quy mô đơn hàng / tháng:</span>
                    <span className="text-[#EF4623] font-mono text-sm bg-[#EF4623]/10 px-3 py-1 rounded-full border border-[#EF4623]/20">
                      {events},000 Đơn hàng
                    </span>
                  </div>

                  {/* Range Input Slider */}
                  <div className="relative pt-4 pb-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={events}
                      onChange={(e) => setEvents(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#EF4623]"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2">
                      <span>1K</span>
                      <span>25K</span>
                      <span>50K</span>
                      <span>75K</span>
                      <span>100K+</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/brand/login"
                  className="block w-full py-4 text-center bg-[#EF4623] text-white font-extrabold rounded-[30px] text-xs uppercase tracking-wider shadow-lg shadow-[#EF4623]/30 hover:bg-[#D83B19] transition-all"
                >
                  Kích Hoạt Gói Growth Ngay →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
