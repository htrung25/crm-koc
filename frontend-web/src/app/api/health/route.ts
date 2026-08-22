import { NextResponse } from "next/server";

// Liveness thuần: không gọi API backend, không đọc cookie. Dùng cho Docker
// HEALTHCHECK và Uptime Kuma.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
