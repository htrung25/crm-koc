# Khôi phục Postgres — runbook

> **Trạng thái (2026-09-10): cơ chế backup CHƯA được triển khai.**
> Tài liệu này mô tả quy trình đích. Cho tới khi bước 8 của mục "Tình trạng
> triển khai" được đánh dấu xong, **không có backup nào để khôi phục**.

Không có secret nào trong tài liệu này. Mọi giá trị nhạy cảm nằm ở
`/srv/crm-koc/backup/.env` trên VPS (chmod 600, provision thủ công).

## Trước khi bắt đầu

Bạn cần:

| Thứ | Ở đâu |
| --- | --- |
| SSH vào VPS | Khoá deploy, xem GitHub Secrets `SSH_HOST` / `SSH_USER` |
| `/srv/crm-koc/backup/.env` | Trên VPS. Mất file này thì xem "Mất cả VPS" |
| Passphrase mã hoá repo | Bản sao ngoài băng, **không** ở GitHub |
| `SOCIAL_TOKEN_ENCRYPTION_KEY` | Bản sao ngoài băng |
| `DATABASE_PASSWORD`, `JWT_*_SECRET` | GitHub Secrets + bản sao ngoài băng |

**Mất `SOCIAL_TOKEN_ENCRYPTION_KEY` thì social token trong DB không giải mã lại
được, dù DB khôi phục hoàn hảo.** Đây là thứ duy nhất backup không cứu được.

Biến dùng trong các lệnh dưới đây:

```bash
STACK=prod                              # hoặc staging
STANZA=crm-koc
PG=crm-koc-${STACK}-db-postgres-1       # tên container Postgres
ENV=/srv/crm-koc/${STACK}/.env
```

## Bước 0 — Luôn làm đầu tiên: xác định phạm vi

```bash
# Repo backup có đọc được không, bản mới nhất là bao giờ?
docker exec -u postgres $PG pgbackrest --stanza=$STANZA info
```

Đọc `timestamp stop` của bản full mới nhất và dải WAL đang giữ. Đây là biên
của những gì bạn khôi phục được. Nếu lệnh này lỗi, nhảy xuống mục "Sự cố
thường gặp".

**Ghi lại thời điểm cần khôi phục về** trước khi đụng vào bất cứ thứ gì. Với
sự cố xoá nhầm dữ liệu, đó là thời điểm *ngay trước* thao tác gây hại.

## Kịch bản A — Xoá nhầm dữ liệu, VPS còn sống

Đây là kịch bản hay gặp nhất. **Không** restore đè lên DB đang chạy. Restore ra
một chỗ riêng, lấy phần dữ liệu cần, rồi mới quyết định.

```bash
# 1. Dừng app để không có ghi mới trong lúc xử lý
cd /srv/crm-koc/api-${STACK}
docker compose --env-file $ENV --env-file .env.deploy \
  -f compose.api.base.yml -f compose.api.${STACK}.yml stop api api-worker

# 2. Restore vào thư mục tạm, tới đúng thời điểm cần
docker exec -u postgres $PG pgbackrest --stanza=$STANZA \
  --type=time --target="2026-09-10 14:23:00+07" \
  --target-action=promote \
  --pg1-path=/tmp/restore restore

# 3. Dựng một Postgres tạm trỏ vào /tmp/restore, port khác, rồi
#    pg_dump đúng bảng cần và nạp ngược sang DB thật.
```

Chỉ khi đã xác nhận dữ liệu ở bản tạm đúng mới nạp ngược. Bật lại app:

```bash
docker compose --env-file $ENV --env-file .env.deploy \
  -f compose.api.base.yml -f compose.api.${STACK}.yml start api api-worker
```

## Kịch bản B — Postgres hỏng, VPS còn sống

Mục tiêu RTO: 30–60 phút *(chưa đo — cập nhật sau diễn tập)*.

```bash
# 1. Dừng app trước, để migration không chạy vào DB nửa vời
cd /srv/crm-koc/api-${STACK}
docker compose --env-file $ENV --env-file .env.deploy \
  -f compose.api.base.yml -f compose.api.${STACK}.yml down

# 2. Dừng Postgres
cd /srv/crm-koc/infra
APP_ENV_FILE=$ENV STACK=$STACK docker compose --env-file $ENV \
  -f services/compose.db.yml -p crm-koc-${STACK}-db stop postgres

# 3. Restore đè lên PGDATA. --delta chỉ ghi lại phần khác nhau, nhanh hơn nhiều.
#    Bỏ --type/--target nếu muốn phục hồi tới điểm mới nhất có thể.
docker exec -u postgres $PG pgbackrest --stanza=$STANZA --delta restore

# 4. Khởi động lại; Postgres sẽ replay WAL rồi mở
APP_ENV_FILE=$ENV STACK=$STACK docker compose --env-file $ENV \
  -f services/compose.db.yml -p crm-koc-${STACK}-db up -d postgres
docker logs -f $PG   # chờ "database system is ready to accept connections"
```

### Xác minh trước khi mở lại cho người dùng

```bash
docker exec -u postgres $PG psql -d "$POSTGRES_DB" -c "\dt" | head -30
docker exec -u postgres $PG psql -d "$POSTGRES_DB" -c \
  "select count(*) from accounts;"
docker exec -u postgres $PG psql -d "$POSTGRES_DB" -c \
  "select max(created_at) from audit_log;"
```

`max(created_at)` cho biết **RPO thực tế của lần khôi phục này** — khoảng cách
từ đó tới thời điểm sự cố chính là lượng dữ liệu đã mất. Ghi lại con số.

Kiểm tra migration khớp với image app sắp chạy:

```bash
cd /srv/crm-koc/api-${STACK}
docker compose --env-file $ENV --env-file .env.deploy \
  -f compose.api.base.yml -f compose.api.${STACK}.yml up -d
```

`api-migrate` chạy trước và fail sẽ chặn `api` khởi động — đó là hàng rào an
toàn, đừng bỏ qua nó bằng tay.

## Kịch bản C — Mất cả VPS

Mục tiêu RTO: 2–4 giờ *(chưa đo)*. Nút thắt là dựng host và DNS, không phải
Postgres.

1. **Dựng VPS mới**, cài Docker + docker compose.
2. **Khôi phục `/srv/crm-koc/backup/.env`** từ bản sao ngoài băng. Không có file
   này thì không đọc được repo backup — đây là điều kiện tiên quyết tuyệt đối.
3. Tạo network: `docker network create prod_internal`
4. `rsync` thư mục `deploy/` của repo sang `/srv/crm-koc/infra/`.
5. Dựng lại `/srv/crm-koc/prod/.env` từ GitHub Secrets *(chạy lại
   `deploy-prod.yml` là cách nhanh nhất — nó render file này)*.
6. Khởi động Postgres rỗng, rồi restore:
   ```bash
   docker exec -u postgres $PG pgbackrest --stanza=$STANZA restore
   ```
7. Chạy `deploy-prod.yml` để kéo image và dựng app.
8. Trỏ DNS sang IP mới. Chờ TTL.
9. Phát hành lại cert.

## Sự cố thường gặp

### `pgbackrest info` báo không đọc được repo

Theo thứ tự: credential R2 trong `/srv/crm-koc/backup/.env` còn hạn không →
token có bị revoke không → bucket còn tồn tại không → passphrase mã hoá có đúng
không. Sai passphrase thường báo lỗi giải mã chứ không báo lỗi mạng.

### Disk đầy, Postgres ngừng ghi

Nguyên nhân gần như chắc chắn: `archive_command` fail liên tục nên WAL không
được dọn.

```bash
docker exec -u postgres $PG psql -c "select * from pg_stat_archiver;"
```

`last_failed_time` mới hơn `last_archived_time` là xác nhận. **Đừng xoá tay file
trong `pg_wal`** — sẽ phá luôn khả năng PITR. Sửa nguyên nhân (thường là mạng
hoặc credential R2), archive sẽ tự đuổi kịp và Postgres tự dọn.

Nếu cần chỗ trống gấp: dọn log Docker (`docker system prune`), đừng đụng
`pg_wal`.

### Backup đêm không chạy

Kiểm tra cron trên host và log:

```bash
crontab -l | grep pgbackrest
tail -100 /var/log/crm-koc-backup.log
```

Nếu uptime-kuma đã báo động thì mốc thời gian trong đó cho biết lần ping cuối,
tức lần cuối mọi thứ còn xanh.

## Diễn tập

Backup chưa từng khôi phục thì chưa phải backup.

- **Hằng tuần, tự động:** `restore-drill.sh` chạy trên VPS, restore vào container
  tạm, sanity query, huỷ. Chỉ chứng minh repo đọc được.
- **Định kỳ, thủ công:** diễn tập kịch bản C trên **máy sạch**. Đây là thứ duy
  nhất chứng minh được RTO. Sau mỗi lần, cập nhật số đo thật vào tài liệu này
  và thay các chỗ đang ghi *(chưa đo)*.

## Tình trạng triển khai

- [ ] 1. Bucket + token R2 riêng, `/srv/crm-koc/backup/.env` provision thủ công
- [ ] 2. Xác minh pgBackRest × R2 trên staging
- [ ] 3. Image `crm-koc-postgres`, `compose.db.yml`, bật `archive_mode` (staging)
- [ ] 4. `bootstrap.sh`: tạo stanza, cài cron (staging)
- [ ] 5. Backup thủ công + `restore-drill.sh` chạy được (staging)
- [ ] 6. Lặp lại bước 3–5 trên prod
- [ ] 7. Nối uptime-kuma push monitor
- [ ] 8. Diễn tập máy sạch, đo RPO/RTO, ghi số thật vào tài liệu này
- [ ] 9. Gỡ `BACKUP_S3_BUCKET` khỏi `deploy-prod.yml`
