#!/usr/bin/env bash
# rollback.sh <staging|prod> [image-tag]
#
# Không tag => dùng .previous-good (bản tốt liền trước bản đang chạy).
# Chỉ rollback IMAGE. Schema database không lùi — xem docs/runbook/rollback.md.
set -euo pipefail

STACK="${1:?usage: rollback.sh <staging|prod> [image-tag]}"
TAG="${2:-}"

ROOT="${DEPLOY_ROOT:-/srv/crm-koc}"
DIR="$ROOT/api-$STACK"
ENV_DIR="$ROOT/$STACK"
REGISTRY="${REGISTRY:-ghcr.io}"
OWNER="${IMAGE_OWNER:-htrung25}"
READY_TIMEOUT="${READY_TIMEOUT:-90}"

cd "$DIR"

if [ -z "$TAG" ]; then
  [ -f .previous-good ] || {
    echo "không có .previous-good — phải truyền tag cụ thể" >&2
    exit 1
  }
  TAG=$(cat .previous-good)
fi

compose() {
  APP_ENV_FILE="$ENV_DIR/.env" STACK="$STACK" docker compose \
    --env-file "$ENV_DIR/.env" \
    --env-file .env.deploy \
    -f compose.api.base.yml \
    -f "compose.api.$STACK.yml" \
    "$@"
}

cat > .env.deploy <<EOF
IMAGE_TAG=$TAG
API_IMAGE=$REGISTRY/$OWNER/crm-koc-api:$TAG
STACK=$STACK
EOF

echo "==> rollback API $STACK về $TAG"
compose pull
compose up -d --remove-orphans

ready_probe() {
  compose exec -T "$1" node -e "
      fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health/ready')
        .then(r => process.exit(r.ok ? 0 : 1))
        .catch(() => process.exit(1));
    " 2>/dev/null
}

deadline=$((SECONDS + READY_TIMEOUT))
while [ "$SECONDS" -lt "$deadline" ]; do
  # Worker xanh nhưng API đỏ (hoặc ngược lại) đều không phải rollback thành công.
  if ready_probe api && ready_probe api-worker; then
    echo "$TAG" > .last-good
    echo "✅ API $STACK đã về $TAG"
    exit 0
  fi
  sleep 3
done

echo "!! rollback API cũng không xanh — mở docs/runbook/incident.md" >&2
compose logs --tail 100 api api-worker api-migrate >&2 || true
exit 1
