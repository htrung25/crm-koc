const { readFileSync } = require("node:fs");

const EXPECTED_MATCHER = "/((?!api|_next|_vercel|.*\\..*).*)";
const MANIFEST = ".next/server/functions-config-manifest.json";

let functions;
try {
  functions = JSON.parse(readFileSync(MANIFEST, "utf8")).functions ?? {};
} catch {
  console.error(`❌ Không đọc được ${MANIFEST}. Chạy \`next build\` trước.`);
  process.exit(1);
}

const middleware = functions["/_middleware"];
if (!middleware) {
  console.error("❌ Không có /_middleware trong manifest.");
  console.error("   proxy.ts phải nằm cùng cấp với app/ (hiện tại: src/proxy.ts),");
  console.error("   và phải export hàm tên `proxy` hoặc export default.");
  process.exit(1);
}

const actual = middleware.matchers?.[0]?.originalSource;
if (actual !== EXPECTED_MATCHER) {
  console.error("❌ Matcher không khớp.");
  console.error(`   mong đợi: ${EXPECTED_MATCHER}`);
  console.error(`   thực tế : ${actual}`);
  console.error(
    "   Nếu thấy '/:path*': export cấu hình phải tên `config`, không phải",
  );
  console.error(
    "   `proxyConfig`. Sai tên thì Next dùng matcher mặc định bắt MỌI request,",
  );
  console.error("   kể cả /_next/static — next-intl sẽ redirect luôn cả CSS/JS.");
  process.exit(1);
}

console.log("✅ Proxy đăng ký đúng, matcher khớp.");
