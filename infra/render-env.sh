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
#
# Tách hai nhóm vì nơi đặt trên GitHub khác nhau. Đây cũng là nguồn sự thật duy
# nhất về việc biến nào đặt ở đâu — docs/ nằm trong .gitignore nên tài liệu
# không thể được CI kiểm chứng.
missing_vars=()
missing_secrets=()

require_var() {
  local name
  for name in "$@"; do
    [ -n "${!name:-}" ] || missing_vars+=("$name")
  done
}

require_secret() {
  local name
  for name in "$@"; do
    [ -n "${!name:-}" ] || missing_secrets+=("$name")
  done
}

require_var DATABASE_USERNAME DATABASE_NAME CORS_ORIGIN
require_var SOCIAL_OAUTH_CALLBACK_BASE_URL STORAGE_ENDPOINT
require_secret DATABASE_PASSWORD JWT_ACCESS_SECRET JWT_REFRESH_SECRET
require_secret SOCIAL_TOKEN_ENCRYPTION_KEY
require_secret STORAGE_ACCESS_KEY_ID STORAGE_SECRET_ACCESS_KEY STORAGE_BUCKET

if [ "${#missing_vars[@]}" -gt 0 ] || [ "${#missing_secrets[@]}" -gt 0 ]; then
  {
    echo "render-env: thiếu cấu hình cho environment '$STACK'."
    echo
    if [ "${#missing_vars[@]}" -gt 0 ]; then
      echo "  Settings → Environments → $STACK → Variables:"
      printf '    %s\n' "${missing_vars[@]}"
      echo
    fi
    if [ "${#missing_secrets[@]}" -gt 0 ]; then
      echo "  Settings → Environments → $STACK → Secrets:"
      printf '    %s\n' "${missing_secrets[@]}"
      echo
    fi
    echo "Tên phải khớp block 'env:' của step 'Render .env' trong workflow deploy."
    echo "Lưu ý: biến đã tạo nhưng để rỗng cũng bị tính là thiếu."
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
KYC_VALIDITY_DAYS=${KYC_VALIDITY_DAYS:-365}
STORAGE_SWEEP_PENDING_GRACE_MINUTES=${STORAGE_SWEEP_PENDING_GRACE_MINUTES:-60}

# --- Kafka / audit log ---
KAFKA_ENABLED=${KAFKA_ENABLED:-false}
KAFKA_BROKERS=${KAFKA_BROKERS:-kafka:9092}
KAFKA_PORT=${KAFKA_PORT:-9092}
KAFKA_CLIENT_ID=${KAFKA_CLIENT_ID:-crm-koc-api}
KAFKA_SSL_ENABLED=${KAFKA_SSL_ENABLED:-false}
KAFKA_ALLOW_AUTO_TOPIC_CREATION=${KAFKA_ALLOW_AUTO_TOPIC_CREATION:-false}
KAFKA_SASL_MECHANISM=${KAFKA_SASL_MECHANISM:-}
KAFKA_USERNAME=${KAFKA_USERNAME:-}
KAFKA_PASSWORD=${KAFKA_PASSWORD:-}
KAFKA_AUDIT_CONSUMER_GROUP=${KAFKA_AUDIT_CONSUMER_GROUP:-crm-koc-admin-log}
KAFKA_AUDIT_MAX_ATTEMPTS=${KAFKA_AUDIT_MAX_ATTEMPTS:-3}
KAFKA_AUDIT_RETRY_DELAY_MS=${KAFKA_AUDIT_RETRY_DELAY_MS:-250}
EOF
