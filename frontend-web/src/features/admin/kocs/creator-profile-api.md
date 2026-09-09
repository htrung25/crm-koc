# Hồ sơ Creator dành cho Admin — bàn giao API

Phạm vi thay đổi: chỉ frontend. Không sửa backend, schema DB hoặc quyền trên backend.

## Luồng đã kết nối

- Danh sách: `GET /api/admin/creators` → `GET /admin/creators-list`.
- Chi tiết: `GET /api/admin/creators/:id` → `GET /admin/creators-list/:id`.
- `id` là UUID tài khoản Creator (`accounts.id`, cũng là `creator_profiles.account_id`), không phải ID social account.
- Danh sách gửi `page`, `limit=10`, `search`, `status`, `sortBy=createdAt`, `sortOrder=DESC`.
- Chi tiết gửi `historyPage`, `historyLimit=10`. Backend hiện bỏ qua hai tham số này; cần hỗ trợ khi bổ sung lịch sử.
- Frontend chỉ expose GET; không có thêm, sửa, xóa hồ sơ ở màn hình Admin Creator mới. Backend vẫn có DELETE `/admin/creators-list/:id`; thay đổi frontend này không thu hồi quyền DELETE đó.
- Mỗi hồ sơ có query key theo ID và trang lịch sử; không dùng dữ liệu dòng danh sách hoặc hồ sơ trước làm chi tiết.

## API đang có

`GET /admin/creators-list/:id` hiện trả thông tin tài khoản:

`id`, `name`, `email`, `phone`, `accountRole`, `status`, `emailVerifiedAt`, `createdAt`.

`status` là trạng thái **tài khoản**, không phải trạng thái hợp tác: 1 chờ xác minh, 2 hoạt động, 3 tạm ngưng, 4 khóa.

## Hợp đồng mở rộng dự kiến, CHƯA có trong API hiện tại

Giữ các field tài khoản ở cấp ngoài và bổ sung các nhóm dưới. Frontend đã khai báo schema runtime trong `src/features/admin/kocs/creator-types.ts`. Những nhóm thiếu hoặc null hiển thị “Chưa có dữ liệu”; mảng rỗng là đã xác định không có bản ghi. Không dùng số 0 thay cho dữ liệu chưa được cung cấp.

| Nhóm/field                                                       | Kiểu JSON                   | Ý nghĩa và nguồn dự kiến                                                                                                 |
| ---------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `profile`                                                        | object hoặc null            | `creator_profiles`, chỉ các field công khai cho Admin bên dưới                                                           |
| `profile.displayName`, `email`, `phone`, `bio`, `avatarUrl`      | string hoặc null            | Hồ sơ và liên hệ                                                                                                         |
| `profile.dateOfBirth`                                            | YYYY-MM-DD hoặc null        | Ngày sinh                                                                                                                |
| `profile.gender`                                                 | 1/2/3 hoặc null             | Nam/nữ/khác                                                                                                              |
| `profile.city`, `address`, `portfolioUrl`, `timezone`            | string hoặc null            | Địa bàn, địa chỉ, portfolio, múi giờ                                                                                     |
| `profile.contentCategories`                                      | string[]                    | Các lĩnh vực nội dung                                                                                                    |
| `profile.updatedAt`                                              | ISO datetime hoặc null      | Lần cập nhật hồ sơ                                                                                                       |
| `platforms`                                                      | array hoặc null             | Social account của đúng Creator                                                                                          |
| `platforms[].id`, `platform`                                     | string                      | ID social account, mã nền tảng tiktok/instagram/youtube/facebook                                                         |
| `platforms[].username`                                           | string hoặc null            | Tên tài khoản nền tảng                                                                                                   |
| `platforms[].followerCount`                                      | chuỗi số hoặc null          | `social_accounts.follower_count`                                                                                         |
| `platforms[].engagementRate`                                     | chuỗi số hoặc null          | Đơn vị phần trăm: `4.25` hiển thị `4,25%`, không nhân 100                                                                |
| `platforms[].averageViews`                                       | chuỗi số hoặc null          | **Chưa có cột chuẩn hóa**; backend cần quy định nguồn và khoảng thời gian đo                                             |
| `platforms[].totalLikes`                                         | chuỗi số hoặc null          | **Chưa có cột chuẩn hóa**; không lấy dữ liệu tùy ý từ rawData                                                            |
| `platforms[].lastSyncedAt`                                       | ISO datetime hoặc null      | Thời điểm đồng bộ chỉ số                                                                                                 |
| `statistics.completedCampaigns`                                  | integer hoặc null           | Đếm DISTINCT campaign_id của hợp tác COMPLETED của Creator; bỏ campaign_id null                                          |
| `statistics.totalRevenue`                                        | chuỗi số hoặc null          | Theo yêu cầu: tổng agreed_price của hợp tác COMPLETED, gồm hợp tác không gắn campaign; không phải tiền thực nhận hay GMV |
| `statistics.currency`                                            | string                      | Mặc định VND; chỉ cộng tiền cùng đơn vị                                                                                  |
| `brandReviews`                                                   | object hoặc null            | **Chưa tìm thấy model/API đánh giá**; cần bổ sung nguồn dữ liệu                                                          |
| `brandReviews.averageRating`                                     | number 0–5 hoặc null        | Điểm trung bình trên toàn bộ đánh giá                                                                                    |
| `brandReviews.total`                                             | integer                     | Tổng số đánh giá                                                                                                         |
| `brandReviews.data`                                              | array                       | Danh sách đánh giá; hiện frontend hiển thị tất cả phần tử được trả                                                       |
| `brandReviews.data[]`                                            | object                      | `id`, `brandName`, `rating` (0–5), `comment` (nullable), `createdAt`                                                     |
| `campaignHistory`                                                | pagination object hoặc null | `{data, total, page, limit, totalPages}`; backend lọc theo creator_id trước phân trang                                   |
| `campaignHistory.data[].id`                                      | string                      | ID collaboration, duy nhất cho từng dòng                                                                                 |
| `campaignHistory.data[].campaignId`, `campaignName`, `brandName` | string hoặc null            | Join campaign và brand; tên fallback cần xử lý phía API                                                                  |
| `campaignHistory.data[].startedAt`, `completedAt`                | ISO datetime hoặc null      | Thời gian hợp tác                                                                                                        |
| `campaignHistory.data[].revenue`                                 | chuỗi số hoặc null          | Giá trị được ghi nhận từ hợp tác đã hoàn thành; chưa hoàn thành trả null                                                 |
| `campaignHistory.data[].status`                                  | integer 1–6                 | PENDING, ACTIVE, SUBMITTED, COMPLETED, CANCELLED, DISPUTED                                                               |

Doanh thu là giá trị hợp tác đã hoàn thành theo xác nhận của người dùng. Quy tắc đếm campaign DISTINCT và cách xử lý hợp tác không gắn campaign ở trên là đề xuất hợp đồng cần backend thống nhất. Nếu hợp tác hoàn thành chưa có agreed_price, không tự coi đó là 0; trả null khi chưa thể xác định tổng chính xác.

Không trả access/refresh token mạng xã hội, token mã hóa, rawData hoặc bí mật tài khoản trong response hồ sơ. Response frontend được parse theo whitelist field. Quyền đọc vẫn phải được backend kiểm tra qua JWT, role Admin và IP whitelist.

## Kiểm tra tích hợp khi backend bổ sung

1. Hai Creator khác nhau trả đúng ID và dữ liệu riêng; UUID không tồn tại trả 404.
2. Mảng rỗng khác field bị thiếu; số 0 là dữ liệu hợp lệ.
3. Tiền và bigint trả chuỗi, không làm tròn qua JavaScript Number.
4. Phân trang lịch sử không làm thay đổi tổng doanh thu, tổng campaign, điểm đánh giá toàn hồ sơ.
5. 401/403 không trả profile; Admin không có endpoint PATCH/PUT để sửa profile.
6. Nếu đánh giá cần phân trang, bổ sung hợp đồng và UI trước khi trả danh sách bị cắt mà không có cách xem tiếp.
