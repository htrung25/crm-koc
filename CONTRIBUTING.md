# Contributing — CRM-KOC

Monorepo: `api/` (NestJS 11) và `frontend-web/` (Next 16). Node 24.

## Nhánh

```
feat/* | fix/*  ──PR + CI──►  develop  ──auto deploy──►  staging
                                 │
                              PR + CI
                                 ▼
                               main  ──git tag v*──►  [approval]  ──►  production
```

- `develop` là nhánh mặc định, phản chiếu staging.
- `main` phản chiếu production. Chỉ vào `main` bằng PR từ `develop`.
- Không tạo nhánh dài hạn theo app (`api-dev`, `frontend-dev`). CI đã lọc theo
  đường dẫn nên PR chỉ đụng một app sẽ không chạy job của app kia.
- Nhánh feature xoá ngay sau khi merge.

## Commit

- Viết bằng tiếng Anh, thể mệnh lệnh: `feat: add kyc document stream endpoint`.
- Prefix: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `ci`.

## Release

```bash
git switch main && git pull
git tag v1.4.0 && git push origin v1.4.0
```

Tag `v*` kích hoạt workflow deploy production; workflow chờ approval trước khi
chạm server. Tag phải trỏ vào commit đã có image trên GHCR (tức là commit đã
từng đi qua `develop`).

## Migration phải backward-compatible

Rollback của hệ thống này là rollback **image**, không rollback **schema**. Một
bản deploy hỏng được đưa về image cũ trong ~30 giây, nhưng database vẫn giữ
schema mới. Vì vậy schema mới phải chạy được với code cũ.

Quy tắc:

- Thêm cột: luôn `nullable` hoặc có `DEFAULT`. Không `NOT NULL` trần trong cùng
  một release với code ghi vào cột đó.
- Đổi tên cột: làm hai bước — release N thêm cột mới và ghi cả hai; release N+1
  xoá cột cũ.
- Xoá cột / xoá bảng: chỉ làm ở release sau khi không còn code nào đọc nó.
- Đổi kiểu dữ liệu thu hẹp (varchar dài → ngắn, nullable → not null): tách thành
  migration riêng ở release sau.
- Mỗi migration phải có `down()` chạy được. CI có job `migration-smoke` chạy
  `migration:run` rồi `migration:revert` để kiểm chứng.

Nếu một thay đổi không thể backward-compatible, ghi rõ trong mô tả PR và coi
release đó là không rollback được bằng image — xem `docs/runbook/rollback.md`.

## Trước khi mở PR

```bash
# api/
npm run lint && npm run typecheck && npm run build

# frontend-web/
npm run lint && npm run typecheck && npm run test && npm run build
```
