export enum EKycStatus {
  /** Chưa nộp, người dùng đang soạn và tải tài liệu lên. */
  DRAFT = 1,
  PENDING = 2,
  /** Admin xin bổ sung. KHÔNG tính vào hạn mức 3 lượt. */
  MORE_INFO = 3,
  VERIFIED = 4,
  /** Bị từ chối nhưng còn lượt nộp lại. */
  REJECTED = 5,
  /** Hết 3 lượt, phải qua support. Trạng thái cuối. */
  LOCKED = 6,
  /**
   * Đã duyệt nhưng bị thu hồi: giấy tờ hết hạn, hoặc phát hiện giả mạo sau.
   * VERIFIED không phải trạng thái cuối — thiếu lối này thì không có cách nào
   * bắt làm lại KYC.
   */
  EXPIRED = 7,
}

export enum EKycRejectReason {
  BLURRY_IMAGE = 1,
  INFO_MISMATCH = 2,
  EXPIRED_DOCUMENT = 3,
  SUSPECTED_FORGERY = 4,
  /** Bắt buộc kèm review_note — DB có CHECK ràng buộc. */
  OTHER = 5,
}

export enum EKycDocumentType {
  BUSINESS_LICENSE = 1,
  TAX_CERTIFICATE = 2,
  ID_CARD_FRONT = 3,
  ID_CARD_BACK = 4,
  PORTRAIT_WITH_ID = 5,
}
