#!/usr/bin/env bash
# rollback.sh <staging|prod> [image-tag]
#
# Không tag => dùng .previous-good (bản tốt liền trước bản đang chạy).
set -euo pipefail

STACK="${1:?usage: rollback.sh <staging|prod> [image-tag]}"
TAG="${2:-}"

ROOT="${DEPLOY_ROOT:-/srv/crm-koc}"
DIR="$ROOT/web-$STACK"
REGISTRY="${REGISTRY:-ghcr.io}"
OWNER="${IMAGE_OWNER:-htrung25}"
READY_TIMEOUT="${READY_TIMEOUT:-60}"

cd "$DIR"

if [ -z "$TAG" ]; then
  [ -f .previous-good ] || {
    echo "không có .previous-good — phải truyền tag cụ thể" >&2
    exit 1
  }
  TAG=$(cat .previous-good)
fi

compose() {
  STACK="$STACK" docker compose \
    --env-file .env.deploy \
    -f compose.web.base.yml \
    -f "compose.web.$STACK.yml" \
    "$@"
}

cat > .env.deploy <<EOF
IMAGE_TAG=$TAG
WEB_IMAGE=$REGISTRY/$OWNER/crm-koc-web:$TAG
STACK=$STACK
EOF

echo "==> rollback Frontend Web $STACK về $TAG"
compose pull
compose up -d --remove-orphans

deadline=$((SECONDS + READY_TIMEOUT))
while [ "$SECONDS" -lt "$deadline" ]; do
  if compose exec -T web node -e "
      fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health')
        .then(r => process.exit(r.ok ? 0 : 1))
        .catch(() => process.exit(1));
    " 2>/dev/null; then
    echo "$TAG" > .last-good
    echo "✅ Frontend Web $STACK đã về $TAG"
    exit 0
  fi
  sleep 3
done

echo "!! rollback Frontend Web cũng không xanh — mở docs/runbook/incident.md" >&2
compose logs --tail 100 web >&2 || true
exit 1
