#!/usr/bin/env bash
# Sinh nội dung .env cho một stack từ biến môi trường của job deploy, in ra
# stdout. Job sẽ ghi nó xuống /srv/crm-koc/<stack>/.env với mode 600.
#
# Đây là nơi duy nhất liệt kê biến cần cho runtime trên server. Thiếu biến bắt
# buộc thì script chết ngay ở CI, trước khi chạm tới máy chủ.
set -euo pipefail

: "${STACK:?STACK phải là staging hoặc prod}"
case "$STACK" in
  staging | prod) ;;
  *) echo "render-env: STACK='$STACK' không hợp lệ, phải là staging hoặc prod" >&2; exit 1 ;;
esac

# Bắt buộc — không có mặc định, thiếu là fail. Gom hết rồi báo một lần: fail
# lần lượt từng biến bắt người cấu hình phải chạy lại deploy sau mỗi lần sửa.
missing=()
require() {
  local name
  for name in "$@"; do
    [ -n "${!name:-}" ] || missing+=("$name")
  done
}

require DATABASE_USERNAME DATABASE_PASSWORD DATABASE_NAME
require JWT_ACCESS_SECRET JWT_REFRESH_SECRET
require SOCIAL_TOKEN_ENCRYPTION_KEY SOCIAL_OAUTH_CALLBACK_BASE_URL
require CORS_ORIGIN
require STORAGE_ENDPOINT STORAGE_ACCESS_KEY_ID STORAGE_SECRET_ACCESS_KEY STORAGE_BUCKET

if [ "${#missing[@]}" -gt 0 ]; then
  {
    echo "render-env: thiếu ${#missing[@]} biến bắt buộc cho stack '$STACK':"
    printf '  %s\n' "${missing[@]}"
    echo
    echo "Đặt ở GitHub → Settings → Environments → $STACK."
    echo "Giá trị không nhạy cảm vào Variables, phần còn lại vào Secrets; tên phải"
    echo "khớp block 'env:' của step 'Render .env' trong workflow deploy tương ứng."
  } >&2
  exit 1
fi

cat <<EOF
# Sinh tự động bởi workflow deploy — đừng sửa tay, lần deploy sau sẽ ghi đè.
NODE_ENV=production
PORT=3000

DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=$DATABASE_USERNAME
DATABASE_PASSWORD=$DATABASE_PASSWORD
DATABASE_NAME=$DATABASE_NAME
DATABASE_SSL_ENABLED=false

# Khởi tạo container postgres — phải khớp ba biến DATABASE_* ở trên.
POSTGRES_USER=$DATABASE_USERNAME
POSTGRES_PASSWORD=$DATABASE_PASSWORD
POSTGRES_DB=$DATABASE_NAME

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=${REDIS_PASSWORD:-}

CORS_ORIGIN=$CORS_ORIGIN
CORS_CREDENTIALS=true

JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_ACCESS_TTL=${JWT_ACCESS_TTL:-15m}
JWT_REFRESH_TTL=${JWT_REFRESH_TTL:-7d}
JWT_ACCESS_TOKEN_EXPIRES_IN=${JWT_ACCESS_TOKEN_EXPIRES_IN:-15m}

SESSION_TTL_SECONDS=${SESSION_TTL_SECONDS:-604800}
SESSION_ABSOLUTE_TTL_SECONDS=${SESSION_ABSOLUTE_TTL_SECONDS:-604800}
SESSION_MAX_PER_USER=${SESSION_MAX_PER_USER:-10}
SESSION_MAX_PER_ADMIN=${SESSION_MAX_PER_ADMIN:-3}
SESSION_TOUCH_INTERVAL_SECONDS=${SESSION_TOUCH_INTERVAL_SECONDS:-300}

OTP_TTL_SECONDS=${OTP_TTL_SECONDS:-300}
OTP_LOCK_TTL_SECONDS=${OTP_LOCK_TTL_SECONDS:-900}
OTP_MAX_ATTEMPTS=${OTP_MAX_ATTEMPTS:-5}
OTP_RESEND_COOLDOWN_SECONDS=${OTP_RESEND_COOLDOWN_SECONDS:-60}
OTP_MAX_RESENDS=${OTP_MAX_RESENDS:-5}
OTP_RESEND_WINDOW_SECONDS=${OTP_RESEND_WINDOW_SECONDS:-3600}

SENDGRID_API_KEY=${SENDGRID_API_KEY:-}
SENDGRID_FROM=${SENDGRID_FROM:-CRM-KOC System <no-reply@crm-koc.asia>}

SYSTEM_CONFIG_CACHE_TTL_SECONDS=${SYSTEM_CONFIG_CACHE_TTL_SECONDS:-300}

# Prod đóng Swagger; staging để mở cho dễ thử.
SWAGGER_ENABLED=${SWAGGER_ENABLED:-$([ "$STACK" = staging ] && echo true || echo false)}

SOCIAL_TOKEN_ENCRYPTION_KEY=$SOCIAL_TOKEN_ENCRYPTION_KEY
SOCIAL_OAUTH_CALLBACK_BASE_URL=$SOCIAL_OAUTH_CALLBACK_BASE_URL
TIKTOK_CLIENT_KEY=${TIKTOK_CLIENT_KEY:-}
TIKTOK_CLIENT_SECRET=${TIKTOK_CLIENT_SECRET:-}

STORAGE_ENDPOINT=$STORAGE_ENDPOINT
STORAGE_REGION=${STORAGE_REGION:-auto}
STORAGE_ACCESS_KEY_ID=$STORAGE_ACCESS_KEY_ID
STORAGE_SECRET_ACCESS_KEY=$STORAGE_SECRET_ACCESS_KEY
STORAGE_BUCKET=$STORAGE_BUCKET

KYC_MAX_FILE_SIZE_BYTES=${KYC_MAX_FILE_SIZE_BYTES:-10485760}
EOF
