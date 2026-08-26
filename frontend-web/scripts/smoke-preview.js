const base = process.argv[2]?.replace(/\/$/, "");
if (!base) {
  console.error("Cần URL: node scripts/smoke-preview.js https://<preview-url>");
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

/** Bọc trong hàm vì file là CommonJS: top-level await chỉ ESM mới có. */
async function main() {
  // 1. Gốc render thẳng, KHÔNG còn bị gắn tiền tố ngôn ngữ.
  {
    const { status, location } = await head("/");
    check(
      "GET / trả 200, không redirect sang /vi",
      status === 200,
      `${status}${location ? ` -> ${location}` : ""}`,
    );
  }

  // 2. Đường cũ có locale phải chết hẳn — chống hồi quy về [locale].
  {
    const { status, location } = await head("/vi");
    check(
      "GET /vi trả 404 (tiền tố ngôn ngữ đã bỏ)",
      status === 404,
      `${status}${location ? ` -> ${location}` : ""}`,
    );
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

  // 5. PHÂN BIỆT: Route Handler nằm ngoài matcher, proxy không được đụng vào.
  {
    const { status, location } = await head("/api/auth/refresh");
    check(
      "/api/* KHÔNG bị proxy redirect",
      !isRedirect(status),
      `${status}${location ? ` -> ${location}` : ""}`,
    );
  }

  // 6. PHÂN BIỆT: file có phần mở rộng nằm ngoài matcher.
  {
    const { status } = await head("/favicon.ico");
    check("/favicon.ico KHÔNG bị redirect", !isRedirect(status), String(status));
  }

  // 7. Gác đăng nhập vẫn chạy sau khi gỡ i18n khỏi proxy.
  {
    const { status, location } = await head("/admin/dashboard");
    check(
      "Chưa đăng nhập vào /admin/dashboard bị đưa về /admin",
      isRedirect(status) && (location ?? "").endsWith("/admin"),
      `${status} -> ${location}`,
    );
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} case đạt`);
  process.exit(failed.length ? 1 : 0);
}

void main();
