# Chạy API bằng Docker

Mục tiêu: máy nào cũng dựng được đúng một môi trường — cùng Node, cùng
PostgreSQL, cùng Redis — không phụ thuộc vào thứ đã cài sẵn trên máy.

## Lần đầu trên máy mới

```bash
cd api
cp .env.docker.example .env.docker      # rồi điền các secret còn trống
docker compose up --build
```

Sinh secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"   # JWT / COOKIE / SESSION
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"      # SOCIAL_TOKEN_ENCRYPTION_KEY
```

API: <http://localhost:3000> · Swagger: <http://localhost:3000/api/docs>

## Dev và production

Compose tự nạp `docker-compose.override.yml`, nên:

| Lệnh | Chế độ |
|---|---|
| `docker compose up` | **dev** — `nest start --watch`, source bind-mount từ host, sửa file là reload |
| `docker compose -f docker-compose.yml up` | **production** — image đã build, chạy `node dist/src/main.js` |

Sau khi đổi `package.json` hoặc `Dockerfile` thì thêm `--build`. Hai chế độ dùng
tag image khác nhau (`crm-koc-api:dev` / `:prod`) nên không đá nhau.

## Migration

Container tự chạy migration trước khi start (`docker-entrypoint.sh`). Tắt bằng
`RUN_MIGRATIONS=false` trong `.env.docker`, rồi chạy tay khi cần:

```bash
docker compose exec api npm run migration:run
docker compose exec api npm run migration:revert
```

Ngoài Docker (chạy native trên host) thì cần build trước:

```bash
npm run build && npm run migration:run
```

## Những chỗ dễ vấp

- **PostgreSQL phải là 18+**. Migration `UseUuidv7Defaults` gọi `uuidv7()`, hàm
  này chỉ có sẵn từ Postgres 18. Đây chính là lý do image được ghim
  `postgres:18-bookworm`.
- **`POSTGRES_*` phải khớp `DATABASE_USERNAME/PASSWORD/NAME`**. Chúng khởi tạo
  cùng một database. Đổi sau khi volume đã tồn tại thì không ăn — phải
  `docker compose down -v` rồi dựng lại (mất dữ liệu).
- **`DATABASE_HOST` / `REDIS_HOST` bị compose ghi đè** thành `postgres` / `redis`.
  Copy `.env` từ máy khác có `localhost` cũng không sao.
- **Cổng trùng.** Nếu máy đã chạy sẵn Postgres/Redis/API, đổi cổng host bằng
  biến shell hoặc file `.env` (compose đọc `.env` cho phần nội suy `${...}`,
  khác với `.env.docker` chỉ cấp biến cho container):
  ```bash
  HOST_API_PORT=3100 HOST_DB_PORT=55432 HOST_REDIS_PORT=63790 docker compose up
  ```
- **Chế độ dev ghi đè thư mục `dist` trên host** (container build ra JS cho
  Linux). Muốn quay lại chạy native thì `npm run build` lại trên host.
- **Service `postgres` cũng nạp cả `.env.docker`**, nên nó thấy luôn các secret
  của app. Đánh đổi có chủ ý: một file env duy nhất thì không lệch được. Nếu môi
  trường thật cần cô lập, tách `POSTGRES_*` ra file riêng cho service đó.
- **Không mount `node_modules` từ host vào container**: `bcrypt` là native addon,
  bản build trên macOS không chạy được trong Linux container.

## Dọn dẹp

```bash
docker compose down            # dừng, giữ dữ liệu
docker compose down -v         # xoá luôn volume Postgres/Redis/uploads
```
