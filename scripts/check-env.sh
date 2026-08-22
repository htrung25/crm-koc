#!/usr/bin/env bash
# Giữ .env.example trung thực với code, và giữ .env trên server đủ khoá.
#
#   check-env.sh --scan api|web        # CI: mọi biến code đọc phải có trong .env.example
#   check-env.sh --compare <example> <env>   # server: <env> phải có đủ khoá của <example>
#
# Dòng bị comment trong .env.example (`# FOO=`) vẫn tính là đã khai — dùng cho
# biến tuỳ chọn mà mặc định là không set.
set -euo pipefail

fail=0

die() {
  echo "check-env: $*" >&2
  exit 2
}

# In ra tên khoá của một file env, kể cả khoá bị comment.
keys_of() {
  sed -E 's/^[[:space:]]*#[[:space:]]*//' "$1" \
    | grep -oE '^[A-Z][A-Z0-9_]*=' \
    | tr -d '=' \
    | sort -u
}

# In ra tên khoá thực sự được set (không comment, có thể rỗng).
set_keys_of() {
  grep -oE '^[[:space:]]*[A-Z][A-Z0-9_]*=' "$1" \
    | tr -d ' =' \
    | sort -u
}

scan_api() {
  local example="api/.env.example"
  [ -f "$example" ] || die "không thấy $example"

  # Nối từng file thành một dòng để bắt được cả lời gọi .get( xuống dòng.
  local used
  used=$(
    {
      find api/src -name '*.ts' -print0 \
        | xargs -0 -n1 sh -c 'tr "\n" " " < "$0"' \
        | grep -oE "\.get(OrThrow)?[[:space:]]*(<[^>]*>)?[[:space:]]*\([[:space:]]*'[A-Z][A-Z0-9_]*'" \
        | grep -oE "'[A-Z][A-Z0-9_]*'" | tr -d "'"
      grep -rhoE 'process\.env\.[A-Z][A-Z0-9_]*' api/src api/migrations \
        | sed 's/process\.env\.//'
    } | sort -u
  )

  local declared
  declared=$(keys_of "$example")

  # NODE_ENV/PORT do runtime cấp, không bắt buộc khai lại.
  local missing=""
  for k in $used; do
    case "$k" in NODE_ENV) continue ;; esac
    grep -qx "$k" <<<"$declared" || missing+="  $k"$'\n'
  done

  if [ -n "$missing" ]; then
    echo "api: biến được đọc trong code nhưng thiếu trong $example:" >&2
    printf '%s' "$missing" >&2
    fail=1
  else
    echo "api: $example đủ khoá."
  fi
}

scan_web() {
  local example="frontend-web/.env.example"
  [ -f "$example" ] || die "không thấy $example"

  local used
  used=$(grep -rhoE 'process\.env\.[A-Z][A-Z0-9_]*' frontend-web/src frontend-web/scripts \
    | sed 's/process\.env\.//' | sort -u)

  local declared
  declared=$(keys_of "$example")

  local missing=""
  for k in $used; do
    case "$k" in NODE_ENV | PORT | HOSTNAME) continue ;; esac
    grep -qx "$k" <<<"$declared" || missing+="  $k"$'\n'
  done

  if [ -n "$missing" ]; then
    echo "web: biến được đọc trong code nhưng thiếu trong $example:" >&2
    printf '%s' "$missing" >&2
    fail=1
  else
    echo "web: $example đủ khoá."
  fi
}

compare() {
  local example="$1" actual="$2"
  [ -f "$example" ] || die "không thấy $example"
  [ -f "$actual" ] || die "không thấy $actual"

  local missing=""
  while read -r k; do
    [ -n "$k" ] || continue
    grep -qx "$k" <<<"$(set_keys_of "$actual")" || missing+="  $k"$'\n'
  done <<<"$(set_keys_of "$example")"

  if [ -n "$missing" ]; then
    echo "$actual thiếu khoá so với $example:" >&2
    printf '%s' "$missing" >&2
    exit 1
  fi
  echo "$actual đủ khoá so với $example."
}

case "${1:-}" in
  --scan)
    case "${2:-}" in
      api) scan_api ;;
      web) scan_web ;;
      *) die "usage: check-env.sh --scan api|web" ;;
    esac
    ;;
  --compare) compare "${2:?example}" "${3:?env file}" ;;
  *) die "usage: check-env.sh --scan api|web | --compare <example> <env>" ;;
esac

exit "$fail"
