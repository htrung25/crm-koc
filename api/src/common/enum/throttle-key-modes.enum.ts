/* IP:              endpoint công khai, chưa đăng nhập nên chỉ bám được IP.
 * ACCOUNT:         endpoint đã đăng nhập, đếm theo account để nhiều người
 *                  dùng chung IP không chặn nhầm nhau.
 * ACCOUNT_AND_IP:  endpoint nhạy cảm, một account từ nhiều IP khác nhau vẫn
 *                  bị đếm riêng từng IP — token bị lộ cũng không dùng chung
 *                  hạn mức để dò từ nhiều máy.
 * EMAIL_AND_IP:    endpoint chưa đăng nhập nhưng body có email (login, OTP).
 *                  Đếm theo email nên chặn đúng tài khoản bị nhắm tới, kể cả
 *                  khi kẻ tấn công đổi IP; và nhiều người sau cùng một NAT
 *                  không chặn nhầm nhau vì email khác nhau.  */
export enum EThrottleKeyMode {
  IP = 'ip',
  ACCOUNT = 'account',
  ACCOUNT_AND_IP = 'account_and_ip',
  EMAIL_AND_IP = 'email_and_ip',
}
