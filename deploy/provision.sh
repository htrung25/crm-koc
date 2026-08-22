#!/usr/bin/env bash
# provision.sh — dựng một VPS Ubuntu 24.04 trắng thành host chạy được hai stack.
# Chạy bằng root trên máy mới:
#
#   scp -r deploy root@<ip>:/tmp/ && ssh root@<ip> 'bash /tmp/deploy/provision.sh'
#
# Idempotent: chạy lại nhiều lần không hỏng gì.
# Máy này KHÔNG cài Node/npm — image đã build sẵn ở CI.
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
ROOT="${DEPLOY_ROOT:-/srv/crm-koc}"

[ "$(id -u)" -eq 0 ] || {
  echo "phải chạy bằng root" >&2
  exit 1
}

echo "==> gói cơ bản"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg ufw unattended-upgrades gzip

echo "==> Docker Engine + Compose v2"
if ! command -v docker > /dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

echo "==> user $DEPLOY_USER"
if ! id "$DEPLOY_USER" > /dev/null 2>&1; then
  # Không login bằng password; CI vào bằng SSH key.
  adduser --disabled-password --gecos '' "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
echo "    → dán public key CI vào /home/$DEPLOY_USER/.ssh/authorized_keys"

echo "==> thư mục $ROOT"
for d in edge staging prod backups; do
  install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$ROOT/$d"
done

echo "==> network edge"
docker network inspect edge > /dev/null 2>&1 || docker network create edge

echo "==> firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "==> log rotation của Docker daemon"
# Rotation cũng khai trong compose, nhưng đặt ở daemon để container chạy tay
# (backup, migration one-shot) không làm đầy đĩa.
cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" }
}
JSON
systemctl restart docker

echo "==> cron backup (03:15 hằng ngày, giờ máy)"
cat > /etc/cron.d/crm-koc-backup <<CRON
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
15 3 * * * $DEPLOY_USER $ROOT/prod/backup.sh prod >> $ROOT/backups/backup.log 2>&1
CRON
chmod 644 /etc/cron.d/crm-koc-backup

echo
echo "✅ provision xong. Việc còn lại, theo thứ tự:"
echo "   1. dán public key CI vào /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "   2. copy deploy/ vào $ROOT/edge, $ROOT/staging, $ROOT/prod"
echo "   3. tạo $ROOT/edge/.env từ deploy/edge.env.example (điền domain thật)"
echo "   4. trỏ DNS về IP máy này"
echo "   5. cd $ROOT/edge && docker compose -f compose.edge.yml up -d"
echo "   6. chạy workflow deploy-staging trên GitHub"
