#!/usr/bin/env bash
# restore.sh <staging|prod> <file.sql.gz>
#
#   ./restore.sh staging /srv/crm-koc/backups/prod/daily/prod-20260822T031500Z.sql.gz
#
# GHI ĐÈ toàn bộ database của stack đích. Với prod phải gõ xác nhận.
# Quy trình đầy đủ: docs/runbook/restore.md
set -euo pipefail

STACK="${1:?usage: restore.sh <staging|prod> <file.sql.gz>}"
FILE="${2:?usage: restore.sh <staging|prod> <file.sql.gz>}"
ROOT="${DEPLOY_ROOT:-/srv/crm-koc}"
DIR="$ROOT/$STACK"
INFRA_DIR="$ROOT/infra"

[ -f "$FILE" ] || {
  echo "không thấy $FILE" >&2
  exit 1
}

cd "$DIR"
# shellcheck disable=SC1091
set -a
. ./.env
set +a

if [ "$STACK" = "prod" ]; then
  echo "⚠️  Sắp ghi đè DATABASE PRODUCTION bằng $FILE"
  read -r -p "Gõ đúng chữ 'restore prod' để tiếp tục: " confirm
  [ "$confirm" = "restore prod" ] || {
    echo "huỷ."
    exit 1
  }
fi

db_compose() {
  docker compose \
    --env-file "$DIR/.env" \
    -f "$INFRA_DIR/compose.db.yml" \
    -p "crm-koc-${STACK}-db" \
    "$@"
}

echo "==> dừng api/web để không ai ghi vào giữa chừng"
docker compose --env-file "$DIR/.env.deploy" -f "$ROOT/api-$STACK/compose.api.base.yml" -f "$ROOT/api-$STACK/compose.api.$STACK.yml" stop api || true
docker compose --env-file "$DIR/.env.deploy" -f "$ROOT/web-$STACK/compose.web.base.yml" -f "$ROOT/web-$STACK/compose.web.$STACK.yml" stop web || true

echo "==> tạo database trống"
db_compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
DROP DATABASE IF EXISTS "${POSTGRES_DB}_restore";
CREATE DATABASE "${POSTGRES_DB}_restore" OWNER "$POSTGRES_USER";
SQL

echo "==> nạp dump vào ${POSTGRES_DB}_restore"
# Nạp vào DB tạm trước: dump hỏng thì database đang chạy vẫn nguyên vẹn.
gunzip -c "$FILE" \
  | db_compose exec -T postgres \
    psql -U "$POSTGRES_USER" -d "${POSTGRES_DB}_restore" -v ON_ERROR_STOP=1 \
      > /dev/null

echo "==> hoán đổi ${POSTGRES_DB} <- ${POSTGRES_DB}_restore"
db_compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
 WHERE datname IN ('$POSTGRES_DB', '${POSTGRES_DB}_old');
DROP DATABASE IF EXISTS "${POSTGRES_DB}_old";
ALTER DATABASE "$POSTGRES_DB" RENAME TO "${POSTGRES_DB}_old";
ALTER DATABASE "${POSTGRES_DB}_restore" RENAME TO "$POSTGRES_DB";
SQL

echo "==> bật lại api"
docker compose --env-file "$DIR/.env.deploy" -f "$ROOT/api-$STACK/compose.api.base.yml" -f "$ROOT/api-$STACK/compose.api.$STACK.yml" up -d api || true
docker compose --env-file "$DIR/.env.deploy" -f "$ROOT/web-$STACK/compose.web.base.yml" -f "$ROOT/web-$STACK/compose.web.$STACK.yml" up -d web || true

echo "✅ restore xong. Bản cũ còn ở database ${POSTGRES_DB}_old — xoá tay khi đã yên tâm:"
echo "   db_compose exec -T postgres psql -U $POSTGRES_USER -d postgres -c 'DROP DATABASE \"${POSTGRES_DB}_old\";'"
