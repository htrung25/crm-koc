"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createDemoSession } from "@/lib/auth/session";

export default function CreatorLoginPage() {
  const [email, setEmail] = useState("koc@example.com");
  const [password, setPassword] = useState("••••••••");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    createDemoSession("CREATOR");
    router.replace("/creator/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black text-white p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-extrabold text-2xl shadow-lg shadow-violet-500/20">
            ✨
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              CREATOR SPACE
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Không gian làm việc & nhận chiến dịch dành cho KOC / KOL
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Email Creator
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white placeholder-slate-500 text-sm font-medium transition"
              placeholder="koc@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white placeholder-slate-500 text-sm font-medium transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-extrabold rounded-xl shadow-lg shadow-violet-600/30 active:scale-[0.98] transition text-sm"
          >
            Đăng nhập Creator Space
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 font-medium">
          Chưa có tài khoản Creator?{" "}
          <Link href="/register" className="text-violet-400 hover:underline">
            Đăng ký tham gia ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
