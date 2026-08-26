/**
 * Giữ .env.example trung thực với code, và giữ .env trên server đủ khoá.
 *
 *   node scripts/check-env.mjs --scan api|web
 *   node scripts/check-env.mjs --compare <example> <env>
 *
 * Dòng bị comment trong .env.example (`# FOO=`) vẫn tính là đã khai — dùng cho
 * biến tuỳ chọn mà mặc định là không set.
 */
const { readFileSync, readdirSync, statSync } = require("node:fs");

/** Biến hạ tầng đọc bởi container chứ không phải code (postgres, redis…). */
const INFRA_ONLY = new Set([]);

const SKIP_BY_TARGET = {
  api: new Set(["NODE_ENV"]),
  web: new Set(["NODE_ENV", "PORT", "HOSTNAME"]),
};

const TARGETS = {
  api: {
    example: "api/.env.example",
    roots: ["api/src", "api/migrations"],
    onlyTs: true,
  },
  web: {
    example: "frontend-web/.env.example",
    roots: ["frontend-web/src", "frontend-web/scripts"],
    onlyTs: false,
  },
};

const IGNORED_DIRS = new Set(["node_modules", "dist", ".next"]);

function die(message) {
  console.error(`check-env: ${message}`);
  process.exit(2);
}

function walk(dir, onlyTs, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = `${dir}/${entry}`;
    if (statSync(path).isDirectory()) {
      if (!IGNORED_DIRS.has(entry)) walk(path, onlyTs, out);
    } else if (!onlyTs || path.endsWith(".ts")) {
      out.push(path);
    }
  }
  return out;
}

/** Tên khoá của một file env, kể cả khoá bị comment. */
function keysOf(file) {
  return new Set(
    readFileSync(file, "utf8")
      .split("\n")
      .map((line) => line.replace(/^\s*#\s*/, "").match(/^([A-Z][A-Z0-9_]*)=/))
      .filter(Boolean)
      .map((match) => match[1]),
  );
}

/** Tên khoá thực sự được set (không comment, có thể rỗng). */
function setKeysOf(file) {
  return new Set(
    readFileSync(file, "utf8")
      .split("\n")
      .map((line) => line.match(/^\s*([A-Z][A-Z0-9_]*)=/))
      .filter(Boolean)
      .map((match) => match[1]),
  );
}

/**
 * Tên biến code thực sự đọc. Nối cả file thành một dòng để bắt được lời gọi
 * `.get(` xuống dòng.
 */
function usedKeys({ roots, onlyTs }) {
  const used = new Set();
  for (const root of roots) {
    for (const file of walk(root, onlyTs)) {
      const text = readFileSync(file, "utf8").replaceAll("\n", " ");
      const configGet =
        /\.get(?:OrThrow)?\s*(?:<[^>]*>)?\s*\(\s*['"]([A-Z][A-Z0-9_]*)['"]/g;
      for (const match of text.matchAll(configGet)) used.add(match[1]);
      for (const match of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
        used.add(match[1]);
      }
    }
  }
  return used;
}

function report(label, keys) {
  console.error(label);
  for (const key of [...keys].sort()) console.error(`  ${key}`);
}

function scan(name) {
  const target = TARGETS[name];
  if (!target) die("usage: check-env.mjs --scan api|web");

  const declared = keysOf(target.example);
  const used = usedKeys(target);
  const skip = SKIP_BY_TARGET[name];

  const missing = [...used].filter((k) => !skip.has(k) && !declared.has(k));
  // Chiều ngược lại: khai mà không ai đọc. Bỏ qua thì biến chết nằm lại trong
  // .env.example và cả deploy workflow hàng tháng trời không ai biết.
  const orphan = [...declared].filter(
    (k) => !used.has(k) && !INFRA_ONLY.has(k),
  );

  if (missing.length) {
    report(`${name}: biến được đọc trong code nhưng thiếu trong ${target.example}:`, missing);
  }
  if (orphan.length) {
    report(`${name}: biến khai trong ${target.example} nhưng không code nào đọc:`, orphan);
  }
  if (missing.length || orphan.length) process.exit(1);

  console.log(`${name}: ${target.example} khớp với code (${declared.size} khoá).`);
}

function compare(example, actual) {
  const wanted = setKeysOf(example);
  const have = setKeysOf(actual);

  const missing = [...wanted].filter((k) => !have.has(k));
  if (missing.length) {
    report(`${actual} thiếu khoá so với ${example}:`, missing);
    process.exit(1);
  }

  console.log(`${actual} đủ khoá so với ${example}.`);
}

const [mode, first, second] = process.argv.slice(2);

try {
  if (mode === "--scan") scan(first);
  else if (mode === "--compare") {
    if (!first || !second) die("usage: check-env.mjs --compare <example> <env>");
    compare(first, second);
  } else {
    die("usage: check-env.mjs --scan api|web | --compare <example> <env>");
  }
} catch (error) {
  if (error?.code === "ENOENT") die(`không thấy ${error.path}`);
  throw error;
}
