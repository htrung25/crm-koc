# Contributing — CRM-KOC

Monorepo: `api/` (NestJS 11) và `frontend-web/` (Next 16). Node 24.

## Mô hình phân nhánh (Git Flow)

```
feat/*       ●───●
            /     \
develop  ──●───────●───────────────────●  (staging)
                    \                 ▲
                     \ (merge commit) │ (back-merge)
                      ▼               │
main     ─────────────●───────────────●─── (production)
                      │ \            /
                  v1.4.0 \          / v1.4.1
              (tag release)●───●───●
                        hotfix/*
```

### Quy tắc cốt lõi:
1. **`develop`** là nhánh mặc định, phản chiếu môi trường **Staging**.
2. **`main`** phản chiếu môi trường **Production**. Chỉ nhận code qua Pull Request:
   - Từ `develop` khi phát hành tính năng mới.
   - Từ `hotfix/*` khi sửa lỗi khẩn cấp trực tiếp trên Production.
3. **Tuyệt đối KHÔNG SQUASH khi merge `develop` ➔ `main`**:
   - Luôn chọn **Create a merge commit** để bảo toàn toàn bộ lịch sử commit (tránh bị lệch commit SHA giữa 2 nhánh).
4. **Quy trình Hotfix (`hotfix/*`)**:
   - Tạo nhánh từ `main`: `git switch main && git switch -c hotfix/fix-login-error`
   - PR và merge vào `main` ➔ Gắn tag hotfix (ví dụ: `v1.4.1`).
   - **Bắt buộc Back-merge**: Ngay sau khi tag hotfix, tạo PR hoặc merge `main` ngược lại về `develop` để đồng bộ bản vá.
5. **Dọn dẹp nhánh**:
   - Toàn bộ nhánh `feat/*`, `fix/*`, `hotfix/*` phải được **xóa ngay sau khi merge**.

---

## Quy chuẩn Commit

- Viết bằng tiếng Anh, thể mệnh lệnh: `feat: add kyc document stream endpoint`.
- Prefix chuẩn: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `ci`.

---

## Quy trình Release (Phát hành Production)

```bash
# 1. Chuyển sang main và cập nhật mới nhất
git switch main && git pull origin main

# 2. Gắn tag semver và đẩy lên GitHub
git tag v1.4.0
git push origin v1.4.0
```

Tag `v*` kích hoạt workflow `deploy-prod`; workflow chờ approval trước khi deploy lên máy chủ Production.

---

## Database Migration phải Backward-Compatible

Hệ thống hỗ trợ rollback **image trong ~30 giây**, nhưng database **không rollback schema**. Vì vậy schema mới phải tương thích ngược với code cũ:

- **Thêm cột**: Luôn `nullable` hoặc có `DEFAULT`. Không đặt `NOT NULL` trần trong cùng một release với code ghi vào cột đó.
- **Đổi tên cột**: Làm 2 bước:
  - Release N: Thêm cột mới, code ghi đồng thời cả 2 cột.
  - Release N+1: Xóa cột cũ.
- **Xóa cột / Xóa bảng**: Chỉ thực hiện khi không còn đoạn code nào đọc/ghi vào đó.
- Mỗi migration phải có hàm `down()` hoàn chỉnh. CI có job `migration-smoke` chạy `migration:run` và `migration:revert` để kiểm chứng.

---

## Chạy worker khi phát triển local (`api/`)

OTP đăng nhập và email trạng thái KYC đi qua BullMQ, `api` (`start:dev`) chỉ là producer — không tự gửi mail. Không chạy `api-worker` thì job nằm im trong queue: API trả 200 nhưng không mail nào tới, không log lỗi nào cả.

- `npm run start:worker:dev` — chạy worker local, tương tự `start:dev` (watch mode).
- `npm run start:worker` — chạy bản đã build (`dist/src/worker/worker.js`), dùng cho container `api-worker`.

Muốn test luồng OTP/KYC trọn vẹn, chạy song song cả `start:dev` và `start:worker:dev`.

---

## Kiểm tra trước khi mở PR

```bash
# Backend api/
cd api && npm run lint && npm run typecheck && npm run build && cd ..

# Frontend frontend-web/
cd frontend-web && npm run lint && npm run typecheck && npm run test && npm run build && cd ..
```
