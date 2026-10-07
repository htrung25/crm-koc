export enum EKycStatus {
  DRAFT = 1,
  PENDING = 2,
  MORE_INFO = 3,
  VERIFIED = 4,
  REJECTED = 5,
  LOCKED = 6,
  EXPIRED = 7,
}

export enum EKycRejectReason {
  BLURRY_IMAGE = 1,
  INFO_MISMATCH = 2,
  EXPIRED_DOCUMENT = 3,
  SUSPECTED_FORGERY = 4,
  OTHER = 5,
}

export enum EKycDocumentType {
  BUSINESS_LICENSE = 1,
  TAX_CERTIFICATE = 2,
  ID_CARD_FRONT = 3,
  ID_CARD_BACK = 4,
  PORTRAIT_WITH_ID = 5,
}
