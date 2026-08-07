#!/bin/sh
set -e

# Chạy migration trước khi start app. Đặt RUN_MIGRATIONS=false nếu muốn tự chạy
# tay (ví dụ khi nhiều replica cùng khởi động).
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Đang chạy migration..."
  npm run --silent "${MIGRATION_SCRIPT:-migration:run}"
  echo "[entrypoint] Migration xong."
fi

exec "$@"
