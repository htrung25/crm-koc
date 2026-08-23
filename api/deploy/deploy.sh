#!/usr/bin/env bash
# deploy.sh <staging|prod> <image-tag>
#
#   ./deploy.sh staging sha-1a2b3c4
#
# Ghim tag bất biến (sha-*). KHÔNG bao giờ dùng `latest` hay tag nhánh.
set -euo pipefail

STACK="${1:?usage: deploy.sh <staging|prod> <image-tag>}"
TAG="${2:?usage: deploy.sh <staging|prod> <image-tag>}"

case "$STACK" in
  staging | prod) ;;
  *)
    echo "stack phải là staging hoặc prod" >&2
    exit 2
    ;;
esac

case "$TAG" in
  latest | develop | main)
    echo "từ chối deploy tag di động '$TAG'; dùng sha-*" >&2
    exit 2
    ;;
esac

ROOT="${DEPLOY_ROOT:-/srv/crm-koc}"
DIR="$ROOT/api-$STACK"
ENV_DIR="$ROOT/$STACK"
INFRA_DIR="$ROOT/infra"
REGISTRY="${REGISTRY:-ghcr.io}"
OWNER="${IMAGE_OWNER:-htrung25}"
READY_TIMEOUT="${READY_TIMEOUT:-90}"

[ -d "$DIR" ] || {
  echo "không thấy $DIR — chạy provision.sh trước" >&2
  exit 1
}
[ -f "$ENV_DIR/.env" ] || {
  echo "không thấy $ENV_DIR/.env — job deploy phải ghi file này trước" >&2
  exit 1
}

cd "$DIR"

# Đảm bảo database & redis stack đang chạy
echo "==> kiểm tra database/cache stack ($STACK)"
docker compose \
  --env-file "$ENV_DIR/.env" \
  -f "$INFRA_DIR/compose.db.yml" \
  -p "crm-koc-${STACK}-db" \
  up -d

compose() {
  STACK="$STACK" docker compose \
    --env-file "$ENV_DIR/.env" \
    --env-file .env.deploy \
    -f compose.api.base.yml \
    -f "compose.api.$STACK.yml" \
    "$@"
}

ready_probe() {
  compose exec -T "$1" node -e "
      fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health/ready')
        .then(r => process.exit(r.ok ? 0 : 1))
        .catch(() => process.exit(1));
    " 2>/dev/null
}

wait_ready() {
  local deadline=$((SECONDS + READY_TIMEOUT))
  while [ "$SECONDS" -lt "$deadline" ]; do
    # Worker xanh nhưng API đỏ (hoặc ngược lại) đều không phải deploy thành công.
    if ready_probe api && ready_probe api-worker; then
      return 0
    fi
    sleep 3
  done
  return 1
}

auto_rollback() {
  compose logs --tail 100 api api-worker api-migrate >&2 || true
  if [ -f .last-good ]; then
    local previous
    previous=$(cat .last-good)
    if [ "$previous" = "$TAG" ]; then
      echo "!! bản đang lỗi cũng là .last-good — không có đích để lùi" >&2
      exit 1
    fi
    echo "!! tự rollback về $previous" >&2
    exec ./rollback.sh "$STACK" "$previous"
  fi
  echo "!! không có .last-good để rollback — cần xử lý tay" >&2
  exit 1
}

if [ -n "${GHCR_TOKEN:-}" ]; then
  echo "$GHCR_TOKEN" | docker login "$REGISTRY" -u "${GHCR_USER:-x}" --password-stdin
fi

cat > .env.deploy <<EOF
IMAGE_TAG=$TAG
API_IMAGE=$REGISTRY/$OWNER/crm-koc-api:$TAG
STACK=$STACK
EOF

echo "==> pull API $TAG"
compose pull

echo "==> up API"
if ! compose up -d --remove-orphans; then
  echo "!! up thất bại" >&2
  auto_rollback
fi

echo "==> chờ /health/ready (tối đa ${READY_TIMEOUT}s)"
if ! wait_ready; then
  echo "!! readiness không xanh trong ${READY_TIMEOUT}s" >&2
  auto_rollback
fi

[ -f .last-good ] && cp .last-good .previous-good
echo "$TAG" > .last-good

echo "==> dọn image cũ"
docker image prune -f > /dev/null

echo "✅ API $STACK đang chạy $TAG"
