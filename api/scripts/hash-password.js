const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 10;

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('Thiếu mật khẩu.\n');
    console.error("  node scripts/hash-password.js 'abc@123'");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Kiểm tra lại ngay: hash sai thì phát hiện tại đây, không phải lúc login
  const ok = await bcrypt.compare(password, hash);
  if (!ok) {
    console.error('Hash sinh ra không verify được, dừng lại.');
    process.exit(1);
  }

  console.log(hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
