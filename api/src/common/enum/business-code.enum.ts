/**
 * Mã lỗi nghiệp vụ trả kèm trong body response để client phân biệt các trường
 * hợp cùng HTTP status (ví dụ 400 do sai CIDR khác 400 do sai IP).
 */
export enum BusinessCode {
  INVALID_CIDR_FORMAT = 'INVALID_CIDR_FORMAT',
  INVALID_IP_FORMAT = 'INVALID_IP_FORMAT',
  CIDR_EXISTS = 'CIDR_EXISTS',
  IP_ADDRESS_EXISTS = 'IP_ADDRESS_EXISTS',
}
