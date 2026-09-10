import { z } from 'zod';

const numeric = z.union([
  z.number().finite().nonnegative(),
  z.string().regex(/^\d+(\.\d+)?$/),
]);
const metric = numeric.nullish();
const count = z
  .union([
    z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    z.string().regex(/^\d+$/),
  ])
  .nullish();
const money = z.string().regex(/^\d+$/).nullish();
const accountStatus = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
const collaborationStatus = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
const accountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullish(),
  status: accountStatus,
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
 * Absent/null means unavailable, never zero. See contracts/creator-profile.openapi.json. */
export const creatorDetailSchema = accountSchema.extend({
  profile: profileSchema.nullish(),
  platforms: z
    .array(
      z.object({
        id: z.string(),
        platform: z.string(),
        username: z.string().nullish(),
        followerCount: count,
        averageViews: metric,
        totalLikes: count,
        engagementRate: metric,
        lastSyncedAt: z.string().nullish(),
        measurement: z
          .object({
            source: z.string(),
            windowStart: z.string().nullish(),
            windowEnd: z.string().nullish(),
            sampleSize: z.number().int().nonnegative().nullish(),
            engagementFormula: z.string().nullish(),
          })
          .nullish(),
      })
    )
    .nullish(),
  statistics: z
    .object({
      completedCampaigns: z.number().int().nonnegative().nullish(),
      completedCollaborations: z.number().int().nonnegative().nullish(),
      totalRevenue: money,
      currency: z.literal('VND').optional(),
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
          revenue: money,
          agreedPrice: money,
          status: collaborationStatus,
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
