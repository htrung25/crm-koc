/** Quyền lợi hiện vật. Chỉ có nghĩa khi compensationType là PRODUCT/HYBRID. */
export interface CampaignProductBenefit {
  description: string;
  quantity: number;
  delivery: string;
}

/** Đơn vị tuỳ contentType: giây cho video, chữ cho bài viết. Để mở một đầu được. */
export interface CampaignDeliverableDuration {
  unit: string;
  min: number | null;
  max: number | null;
}
