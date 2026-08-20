/**
 * Smoke test hành vi định tuyến trên một deployment đang chạy.
 *
 *   node scripts/smoke-preview.mjs https://<preview-url>
 *
 * Bắt loại lỗi mà `next build` không thấy: proxy không chạy, hoặc chạy sai
 * phạm vi. Case 4-6 là case phân biệt — chúng đo đúng thứ đã làm 404 toàn bộ
 * route: matcher không được đọc nên proxy nuốt cả tài nguyên tĩnh và /api.
 */
const base = process.argv[2]?.replace(/\/$/, "");
if (!base) {
  console.error("Cần URL: node scripts/smoke-preview.mjs https://<preview-url>");
  process.exit(1);
}

/** Không đi theo redirect — chính status và Location là thứ cần đo. */
async function head(path) {
  const response = await fetch(base + path, { redirect: "manual" });
  return { status: response.status, location: response.headers.get("location") };
}

const isRedirect = (s) => s >= 300 && s < 400;
const results = [];

function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

// 1. Gốc phải được gắn locale mặc định.
{
  const { status, location } = await head("/");
  check(
    "GET / redirect sang /vi",
    isRedirect(status) && (location ?? "").endsWith("/vi"),
    `${status} -> ${location}`,
  );
}

// 2. Đường không có locale phải được gắn locale, giữ nguyên phần còn lại.
{
  const { status, location } = await head("/admin/dashboard");
  check(
    "GET /admin/dashboard redirect sang /vi/admin/dashboard",
    isRedirect(status) && (location ?? "").includes("/vi/admin/dashboard"),
    `${status} -> ${location}`,
  );
}

// 3. Đường đã có locale phải render, không redirect vòng.
{
  const { status } = await head("/vi");
  check("GET /vi trả 200", status === 200, String(status));
}

// 4. PHÂN BIỆT: tài nguyên tĩnh KHÔNG được đi qua proxy.
//    Matcher không được đọc -> CSS/JS bị redirect sang /vi/_next/... -> trang trắng.
{
  const { status, location } = await head("/_next/static/chunks/main-app.js");
  check(
    "Tài nguyên /_next/static KHÔNG bị redirect",
    !isRedirect(status),
    `${status}${location ? ` -> ${location}` : ""}`,
  );
}

// 5. PHÂN BIỆT: Route Handler KHÔNG được gắn tiền tố locale.
{
  const { status, location } = await head("/api/auth/refresh");
  check(
    "/api/* KHÔNG bị redirect sang /vi/api/*",
    !(isRedirect(status) && (location ?? "").includes("/vi/api")),
    `${status}${location ? ` -> ${location}` : ""}`,
  );
}

// 6. PHÂN BIỆT: file có phần mở rộng nằm ngoài matcher.
{
  const { status } = await head("/favicon.ico");
  check("/favicon.ico KHÔNG bị redirect", !isRedirect(status), String(status));
}

// 7. Gác đăng nhập vẫn chạy sau khi lồng i18n vào proxy.
{
  const { status, location } = await head("/vi/admin/dashboard");
  check(
    "Chưa đăng nhập vào /vi/admin/dashboard bị đưa về /vi/admin",
    isRedirect(status) && (location ?? "").includes("/vi/admin"),
    `${status} -> ${location}`,
  );
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} case đạt`);
process.exit(failed.length ? 1 : 0);
