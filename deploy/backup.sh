#!/usr/bin/env bash
# backup.sh <staging|prod>
#
# pg_dump từ container postgres của stack → gzip → giữ 7 bản daily + 4 weekly
# cục bộ → upload S3/R2 nếu có BACKUP_S3_BUCKET.
# Cron cài bởi provision.sh, chạy 03:15 hằng ngày.
#
# Một bản backup chưa restore thử thì chưa tính là backup: xem
# docs/runbook/restore.md.
set -euo pipefail

STACK="${1:?usage: backup.sh <staging|prod>}"
ROOT="${DEPLOY_ROOT:-/srv/crm-koc}"
DIR="$ROOT/$STACK"
OUT="$ROOT/backups/$STACK"
KEEP_DAILY="${KEEP_DAILY:-7}"
KEEP_WEEKLY="${KEEP_WEEKLY:-4}"

cd "$DIR"
# shellcheck disable=SC1091
set -a
. ./.env
set +a

mkdir -p "$OUT/daily" "$OUT/weekly"

stamp=$(date -u +%Y%m%dT%H%M%SZ)
file="$OUT/daily/${STACK}-${stamp}.sql.gz"

compose() {
  docker compose \
    --env-file .env.deploy \
    -f compose.base.yml \
    -f "compose.$STACK.yml" \
    "$@"
}

echo "==> pg_dump $STACK -> $file"
# -T: không cấp TTY, nếu không gzip nhận thêm ký tự CR và file hỏng.
compose exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=plain --no-owner \
  | gzip -9 > "$file"

# File rỗng nghĩa là dump hỏng — đừng để nó đẩy bản tốt ra khỏi vòng giữ.
if [ ! -s "$file" ] || [ "$(stat -c %s "$file")" -lt 1024 ]; then
  echo "!! dump quá nhỏ, coi như hỏng: $file" >&2
  rm -f "$file"
  exit 1
fi

# Chủ nhật thì giữ thêm một bản weekly.
if [ "$(date -u +%u)" = "7" ]; then
  cp "$file" "$OUT/weekly/$(basename "$file")"
fi

echo "==> dọn bản cũ (giữ $KEEP_DAILY daily, $KEEP_WEEKLY weekly)"
prune() {
  local dir="$1" keep="$2"
  ls -1t "$dir" | tail -n "+$((keep + 1))" | while read -r old; do
    rm -f "$dir/$old"
  done
}
prune "$OUT/daily" "$KEEP_DAILY"
prune "$OUT/weekly" "$KEEP_WEEKLY"

if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  echo "==> upload s3://$BACKUP_S3_BUCKET/$STACK/"
  # Dùng aws-cli trong container để host không phải cài gì thêm.
  docker run --rm \
    -e AWS_ACCESS_KEY_ID="$STORAGE_ACCESS_KEY_ID" \
    -e AWS_SECRET_ACCESS_KEY="$STORAGE_SECRET_ACCESS_KEY" \
    -e AWS_DEFAULT_REGION="${STORAGE_REGION:-auto}" \
    -v "$OUT/daily:/backup:ro" \
    amazon/aws-cli:latest \
    ${STORAGE_ENDPOINT:+--endpoint-url "$STORAGE_ENDPOINT"} \
    s3 cp "/backup/$(basename "$file")" \
    "s3://$BACKUP_S3_BUCKET/$STACK/$(basename "$file")"
else
  echo "   (BACKUP_S3_BUCKET trống — chỉ giữ bản cục bộ)"
fi

echo "✅ backup xong: $file ($(du -h "$file" | cut -f1))"
