## Nội dung

<!-- Thay đổi gì, vì sao. Link issue nếu có. -->

## Phạm vi

- [ ] `api/`
- [ ] `frontend-web/`
- [ ] hạ tầng (`deploy/`, `.github/`)

## Migration

- [ ] PR này không có migration
- [ ] Có migration và **backward-compatible** (code cũ chạy được với schema mới)
- [ ] Có migration **không** backward-compatible — đã ghi rõ cách rollback bên dưới

<!-- Nếu không backward-compatible: mô tả các bước rollback thủ công. -->

## Kiểm chứng

<!-- Đã chạy gì, kết quả ra sao. Không viết "đã test" suông. -->

## Env mới

- [ ] Không thêm biến môi trường
- [ ] Có thêm — đã cập nhật `.env.example` tương ứng và `docs/deployment/env.md`
