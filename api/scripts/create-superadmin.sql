-- Tạo admin gốc khi DB chưa có account nào.
--
-- Vì sao cần file này: POST /register/admin đòi token của một admin đã đăng
-- nhập, mà khi DB trống thì không tồn tại admin nào để lấy token. Đây là cách
-- phá thế bế tắc đó mà không phải nới lỏng guard.
--
-- Cách dùng:
--   1) node scripts/hash-password.js 'abc@123'
--   2) Dán chuỗi hash vào :password_hash bên dưới
--   3) psql "$DATABASE_URL" -f scripts/create-superadmin.sql
--      (hoặc: psql -h ... -U ... -d ... -f scripts/create-superadmin.sql)
--
-- Chạy lại nhiều lần không tạo trùng: ON CONFLICT DO NOTHING theo email.

BEGIN;

WITH input AS (
  SELECT
    'Huu Trung'::varchar(255)  AS name,
    'admin@gmail.com'::citext  AS email,
    '+84900000001'::varchar(20) AS phone,
    -- THAY bằng hash sinh từ scripts/hash-password.js
    '$2b$10$REPLACE_ME'::text  AS password_hash
),
new_account AS (
  INSERT INTO accounts (account_role, name, email, phone, password, status)
  SELECT
    'admin',
    input.name,
    input.email,
    input.phone,
    input.password_hash,
    -- EAccountStatus.ACTIVE = 2 (cột status là smallint, không phải chuỗi)
    2
  FROM input
  ON CONFLICT (email) DO NOTHING
  RETURNING id, name, email
)
-- Quan hệ 1-1: account_id vừa là PK vừa là FK, giá trị bằng đúng accounts.id.
-- Hồ sơ admin nằm ngay trong admin_users (gộp, không có bảng profile riêng).
-- Thiếu dòng này thì GET /admin/profile/me trả 404 cho chính admin gốc.
INSERT INTO admin_users (account_id, name, email, admin_role)
SELECT id, name, email, 'super_admin' FROM new_account
ON CONFLICT (account_id) DO NOTHING;

COMMIT;

-- Kiểm tra kết quả
SELECT
  a.email,
  a.account_role,
  a.status,
  a.phone,
  (p.account_id IS NOT NULL) AS has_profile
FROM accounts a
LEFT JOIN admin_users p ON p.account_id = a.id
WHERE a.account_role = 'admin';
