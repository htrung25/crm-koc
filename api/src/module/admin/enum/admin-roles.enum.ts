/**
 * Phân cấp NỘI BỘ giữa các admin, khác với ERole vốn phân biệt ba actor
 * (admin/brand/creator).
 *
 * Không nhét 'super_admin' vào accounts.account_role: nhiều chỗ đang switch
 * trên đúng ba vai trò và không có nhánh default, thêm giá trị thứ tư vào đó
 * sẽ làm hỏng hết. Phân cấp này thuộc về admin_users.
 */
export enum EAdminRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}
