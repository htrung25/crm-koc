"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CREATOR' | 'BRAND'>('CREATOR');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to login page for demo
    alert(`Đăng ký tài khoản ${role} thành công! Hãy đăng nhập.`);
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black text-white p-4">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            Tạo Tài Khoản
          </h2>
          <p className="text-sm text-slate-400 mt-2">Bắt đầu kết nối Creator & Brand</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Họ và tên / Tên doanh nghiệp</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white placeholder-slate-500 transition"
              placeholder="Nguyễn Văn A / Công ty B"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white placeholder-slate-500 transition"
              placeholder="koc@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white placeholder-slate-500 transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Tôi muốn đăng ký làm:</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('CREATOR')}
                className={`py-3 px-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-1 transition ${
                  role === 'CREATOR'
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <span>Creator / KOC</span>
                <span className="text-[10px] font-normal opacity-80">Sáng tạo nội dung</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('BRAND')}
                className={`py-3 px-4 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-1 transition ${
                  role === 'BRAND'
                    ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <span>Nhãn Hàng / Brand</span>
                <span className="text-[10px] font-normal opacity-80">Quảng bá thương hiệu</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/30 active:scale-[0.98] transition duration-150"
          >
            Đăng Ký Tài Khoản
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-500">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-violet-400 hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
