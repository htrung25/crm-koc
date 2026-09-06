export enum ECampaignStatus {
  DRAFT = 1,
  PENDING_APPROVAL = 2,
  CHANGES_REQUESTED = 3,
  REJECTED = 4,
  APPROVED = 5,
  /** Huỷ chủ động. Khác EXPIRED — hệ thống kết thúc vì không tuyển được ai. */
  CANCELLED = 6,
}

export enum ECampaignObjective {
  AWARENESS = 'awareness',
  ENGAGEMENT = 'engagement',
  TRAFFIC = 'traffic',
  SALES = 'sales',
}

export enum ECompensationType {
  CASH = 'cash',
  PRODUCT = 'product',
  HYBRID = 'hybrid',
}

export enum EPricingModel {
  FIXED = 'fixed',
  NEGOTIABLE = 'negotiable',
}

export enum ECategoryPolicy {
  ALLOWED = 'allowed',
  /** Gửi duyệt được, nhưng admin phải có thêm checklist/chứng từ. */
  RESTRICTED = 'restricted',
  PROHIBITED = 'prohibited',
}

export enum EReviewDecision {
  APPROVE = 'approve',
  REQUEST_CHANGES = 'request_changes',
  REJECT = 'reject',
}

export enum ECampaignContentType {
  VIDEO = 'video',
  IMAGE_POST = 'image_post',
  LIVESTREAM = 'livestream',
  STORY = 'story',
  REVIEW_ARTICLE = 'review_article',
}

export enum ECampaignAssetKind {
  PRODUCT_IMAGE = 'product_image',
  REFERENCE_FILE = 'reference_file',
}

export enum EUsageRightsKind {
  /** Có hạn: usage_rights_until bắt buộc. */
  FIXED = 'fixed',
  PERPETUAL = 'perpetual',
}

export enum ECampaignActorType {
  BRAND = 'brand',
  ADMIN = 'admin',
  SYSTEM = 'system',
}
