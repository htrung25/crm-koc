#!/usr/bin/env bash
# deploy.sh <staging|prod> <image-tag>
#
#   ./deploy.sh staging sha-1a2b3c4
#
# Ghim tag bất biến (sha-*). KHÔNG bao giờ dùng `latest` hay tag nhánh: tag
# nhánh trỏ vào image khác nhau theo thời gian nên rollback mất ý nghĩa.
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
DIR="$ROOT/$STACK"
REGISTRY="${REGISTRY:-ghcr.io}"
OWNER="${IMAGE_OWNER:-htrung25}"
READY_TIMEOUT="${READY_TIMEOUT:-90}"

[ -d "$DIR" ] || {
  echo "không thấy $DIR — chạy provision.sh trước" >&2
  exit 1
}
[ -f "$DIR/.env" ] || {
  echo "không thấy $DIR/.env — job deploy phải ghi file này trước" >&2
  exit 1
}

cd "$DIR"

compose() {
  docker compose \
    --env-file .env.deploy \
    -f compose.base.yml \
    -f "compose.$STACK.yml" \
    "$@"
}

wait_ready() {
  local deadline=$((SECONDS + READY_TIMEOUT))
  while [ "$SECONDS" -lt "$deadline" ]; do
    if compose exec -T api node -e "
        fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health/ready')
          .then(r => process.exit(r.ok ? 0 : 1))
          .catch(() => process.exit(1));
      " 2>/dev/null; then
      return 0
    fi
    sleep 3
  done
  return 1
}

auto_rollback() {
  compose logs --tail 100 api api-migrate >&2 || true
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
WEB_IMAGE=$REGISTRY/$OWNER/crm-koc-web:$TAG
EOF

echo "==> pull $TAG"
compose pull

echo "==> up"
# api chỉ start sau khi api-migrate exit 0, nên migration hỏng là dừng ở đây và
# container cũ vẫn đang phục vụ traffic.
if ! compose up -d --remove-orphans; then
  echo "!! up thất bại" >&2
  auto_rollback
fi

echo "==> chờ /health/ready (tối đa ${READY_TIMEOUT}s)"
if ! wait_ready; then
  echo "!! readiness không xanh trong ${READY_TIMEOUT}s" >&2
  auto_rollback
fi

# Chỉ ghi .last-good sau khi đã xanh, để lần deploy hỏng kế tiếp có đích lùi.
[ -f .last-good ] && cp .last-good .previous-good
echo "$TAG" > .last-good

echo "==> dọn image cũ"
docker image prune -f > /dev/null

echo "✅ $STACK đang chạy $TAG"
