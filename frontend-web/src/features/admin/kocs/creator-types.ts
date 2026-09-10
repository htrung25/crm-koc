import { z } from 'zod';

const numeric = z.union([
  z.number().finite(),
  z.string().regex(/^\d+(\.\d+)?$/),
]);
const metric = numeric.nullish();
const accountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullish(),
  status: z.number().int(),
  createdAt: z.string(),
  emailVerifiedAt: z.string().nullish(),
});
const profileSchema = z.object({
  displayName: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  bio: z.string().nullish(),
  avatarUrl: z.string().nullish(),
  dateOfBirth: z.string().nullish(),
  gender: z.number().nullish(),
  city: z.string().nullish(),
  address: z.string().nullish(),
  contentCategories: z.array(z.string()).optional(),
  portfolioUrl: z.string().nullish(),
  timezone: z.string().nullish(),
  updatedAt: z.string().nullish(),
});
export const creatorPageSchema = z.object({
  data: z.array(accountSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

/** Optional sections allow the existing account-only API to remain usable.
 * Absent/null means unavailable, never zero. See creator-profile-api.md. */
export const creatorDetailSchema = accountSchema.extend({
  profile: profileSchema.nullish(),
  platforms: z
    .array(
      z.object({
        id: z.string(),
        platform: z.string(),
        username: z.string().nullish(),
        followerCount: metric,
        averageViews: metric,
        totalLikes: metric,
        engagementRate: metric,
        lastSyncedAt: z.string().nullish(),
      })
    )
    .nullish(),
  statistics: z
    .object({
      completedCampaigns: z.number().int().nonnegative().nullish(),
      totalRevenue: metric,
      currency: z.string().optional(),
    })
    .nullish(),
  brandReviews: z
    .object({
      averageRating: z.number().min(0).max(5).nullish(),
      total: z.number().int().nonnegative(),
      data: z.array(
        z.object({
          id: z.string(),
          brandName: z.string(),
          rating: z.number().min(0).max(5),
          comment: z.string().nullish(),
          createdAt: z.string(),
        })
      ),
    })
    .nullish(),
  campaignHistory: z
    .object({
      data: z.array(
        z.object({
          id: z.string(),
          campaignId: z.string().nullish(),
          campaignName: z.string().nullish(),
          brandName: z.string().nullish(),
          startedAt: z.string().nullish(),
          completedAt: z.string().nullish(),
          revenue: metric,
          status: z.number().int(),
        })
      ),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    })
    .nullish(),
});
export type CreatorAccount = z.infer<typeof accountSchema>;
export type CreatorDetail = z.infer<typeof creatorDetailSchema>;
export type CreatorListQuery = {
  page: number;
  limit: number;
  search: string;
  status: string;
};
