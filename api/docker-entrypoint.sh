#!/bin/sh
# Entrypoint chỉ làm hai việc: chờ Postgres mở cổng, rồi exec lệnh được truyền
# vào. Nó KHÔNG tự quyết định chạy migration.
#
# Trên staging/prod migration là command của service one-shot `api-migrate`
# (xem deploy/compose.base.yml). Ngoại lệ duy nhất là dev local: ở đó không có
# service riêng nên đặt RUN_MIGRATIONS=true để entrypoint chạy giúp.
set -eu

WAIT_TIMEOUT="${DB_WAIT_TIMEOUT:-60}"

wait_for_db() {
  node -e '
    const net = require("node:net");
    let host = process.env.DATABASE_HOST || "localhost";
    let port = Number(process.env.DATABASE_PORT || 5432);
    if (process.env.DATABASE_URL) {
      const u = new URL(process.env.DATABASE_URL);
      host = u.hostname;
      port = Number(u.port || 5432);
    }
    const deadline = Date.now() + Number(process.argv[1]) * 1000;
    (function attempt() {
      const socket = net.connect({ host, port });
      socket.setTimeout(2000);
      const retry = () => {
        socket.destroy();
        if (Date.now() > deadline) {
          console.error(`entrypoint: khong ket noi duoc ${host}:${port}`);
          process.exit(1);
        }
        setTimeout(attempt, 1000);
      };
      socket.once("connect", () => { socket.end(); process.exit(0); });
      socket.once("timeout", retry);
      socket.once("error", retry);
    })();
  ' "$WAIT_TIMEOUT"
}

echo "entrypoint: cho Postgres (toi da ${WAIT_TIMEOUT}s)..."
wait_for_db
echo "entrypoint: Postgres san sang."

# Chỉ dev local mới bật. Staging/prod để trống hoặc false.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  script="${MIGRATION_SCRIPT:-migration:run}"
  echo "entrypoint: chay npm run ${script}"
  npm run "$script"
fi

exec "$@"
