// convex/subscriptions.ts
import { v } from 'convex/values';
import { query, mutation, internalMutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

/* ================================================== */
/* GET USER SUBSCRIPTION STATUS */
/* ================================================== */
export const getSubscriptionStatus = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    // Get active subscription
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'active'),
          q.eq(q.field('status'), 'in_grace_period'),
        ),
      )
      .first();

    return {
      tier: user.subscriptionTier || 'free',
      status: user.subscriptionStatus || null,
      platform: user.subscriptionPlatform || null,
      hasActiveSubscription: !!subscription,
      subscription: subscription || null,
    };
  },
});

/* ================================================== */
/* CHECK IF USER HAS ACCESS */
/* ================================================== */
export const hasAccess = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const user = await ctx.db.get(userId);
    if (!user) return false;

    // Check if user has active subscription
    if (
      user.subscriptionTier === 'Orca+' &&
      (user.subscriptionStatus === 'active' ||
        user.subscriptionStatus === 'in_grace_period')
    ) {
      return true;
    }

    return false;
  },
});

/* ================================================== */
/* GET SUBSCRIPTION DETAILS */
/* ================================================== */
export const getSubscription = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .first();

    if (!subscription) return null;

    return {
      ...subscription,
      isActive:
        subscription.status === 'active' ||
        subscription.status === 'in_grace_period',
      daysUntilExpiration: Math.ceil(
        (subscription.expirationDate - Date.now()) / (1000 * 60 * 60 * 24),
      ),
    };
  },
});

/* ================================================== */
/* PURCHASE SUBSCRIPTION (iOS/Android) */
/* ================================================== */
export const purchaseSubscription = mutation({
  args: {
    productId: v.string(),
    platform: v.union(v.literal('ios'), v.literal('android')),
    transactionId: v.string(),
    originalTransactionId: v.string(),
    purchaseDate: v.number(),
    expirationDate: v.number(),
    isTrialPeriod: v.boolean(),
    priceUSD: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    // Determine billing period
    const billingPeriod = args.productId.includes('monthly')
      ? 'monthly'
      : 'yearly';

    // Check if subscription already exists
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_transaction', (q) =>
        q.eq('originalTransactionId', args.originalTransactionId),
      )
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        status: 'active',
        transactionId: args.transactionId,
        expirationDate: args.expirationDate,
        renewalDate: args.expirationDate,
        willRenew: true,
      });

      // Log event
      await ctx.db.insert('subscriptionEvents', {
        userId,
        subscriptionId: existing._id,
        eventType: 'renewal',
        platform: args.platform,
        transactionId: args.transactionId,
        eventDate: Date.now(),
      });

      // Update user status
      await ctx.db.patch(userId, {
        subscriptionTier: 'Orca+',
        subscriptionStatus: 'active',
        subscriptionPlatform: args.platform,
      });

      return { subscriptionId: existing._id, isNewPurchase: false };
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert('subscriptions', {
      userId,
      productId: args.productId,
      platform: args.platform,
      status: 'active',
      purchaseDate: args.purchaseDate,
      expirationDate: args.expirationDate,
      renewalDate: args.expirationDate,
      originalTransactionId: args.originalTransactionId,
      transactionId: args.transactionId,
      isTrialPeriod: args.isTrialPeriod,
      willRenew: true,
      priceUSD: args.priceUSD,
      billingPeriod,
    });

    // Log initial purchase event
    await ctx.db.insert('subscriptionEvents', {
      userId,
      subscriptionId,
      eventType: 'initial_purchase',
      platform: args.platform,
      transactionId: args.transactionId,
      eventDate: Date.now(),
    });

    // Update user status
    await ctx.db.patch(userId, {
      subscriptionTier: 'Orca+',
      subscriptionStatus: 'active',
      subscriptionPlatform: args.platform,
    });

    // Unlock all premium courses
    await unlockPremiumCourses(ctx, userId);

    return { subscriptionId, isNewPurchase: true };
  },
});

/* ================================================== */
/* CANCEL SUBSCRIPTION */
/* ================================================== */
export const cancelSubscription = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .first();

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Mark subscription as cancelled (but still active until expiration)
    await ctx.db.patch(subscription._id, {
      status: 'cancelled',
      cancellationDate: Date.now(),
      willRenew: false,
    });

    // Log cancellation event
    await ctx.db.insert('subscriptionEvents', {
      userId,
      subscriptionId: subscription._id,
      eventType: 'cancellation',
      platform: subscription.platform,
      transactionId: subscription.transactionId,
      eventDate: Date.now(),
    });

    // Update user status
    await ctx.db.patch(userId, {
      subscriptionStatus: 'cancelled',
    });

    return {
      success: true,
      message: `Subscription cancelled. Access continues until ${new Date(
        subscription.expirationDate,
      ).toLocaleDateString()}`,
      expirationDate: subscription.expirationDate,
    };
  },
});

/* ================================================== */
/* RESTORE SUBSCRIPTION */
/* ================================================== */
export const restoreSubscription = mutation({
  args: {
    originalTransactionId: v.string(),
    platform: v.union(v.literal('ios'), v.literal('android')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    // Find subscription by transaction ID
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_transaction', (q) =>
        q.eq('originalTransactionId', args.originalTransactionId),
      )
      .first();

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Check if subscription is still valid
    const now = Date.now();
    const isValid = subscription.expirationDate > now;

    if (isValid) {
      // Reactivate subscription
      await ctx.db.patch(subscription._id, {
        status: 'active',
        willRenew: true,
        cancellationDate: undefined,
      });

      // Update user
      await ctx.db.patch(userId, {
        subscriptionTier: 'Orca+',
        subscriptionStatus: 'active',
        subscriptionPlatform: args.platform,
      });

      // Log reactivation
      await ctx.db.insert('subscriptionEvents', {
        userId,
        subscriptionId: subscription._id,
        eventType: 'reactivation',
        platform: args.platform,
        transactionId: subscription.transactionId,
        eventDate: Date.now(),
      });

      // Unlock premium courses
      await unlockPremiumCourses(ctx, userId);

      return {
        success: true,
        message: 'Subscription restored successfully',
        subscription,
      };
    }

    return {
      success: false,
      message: 'Subscription has expired',
    };
  },
});

/* ================================================== */
/* INTERNAL: HANDLE SUBSCRIPTION RENEWAL */
/* ================================================== */
export const handleRenewal = internalMutation({
  args: {
    originalTransactionId: v.string(),
    transactionId: v.string(),
    expirationDate: v.number(),
    platform: v.union(v.literal('ios'), v.literal('android')),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_transaction', (q) =>
        q.eq('originalTransactionId', args.originalTransactionId),
      )
      .first();

    if (!subscription) {
      console.error('Subscription not found for renewal');
      return { success: false };
    }

    // Update subscription
    await ctx.db.patch(subscription._id, {
      status: 'active',
      transactionId: args.transactionId,
      expirationDate: args.expirationDate,
      renewalDate: args.expirationDate,
      willRenew: true,
    });

    // Log renewal event
    await ctx.db.insert('subscriptionEvents', {
      userId: subscription.userId,
      subscriptionId: subscription._id,
      eventType: 'renewal',
      platform: args.platform,
      transactionId: args.transactionId,
      eventDate: Date.now(),
    });

    // Update user status
    await ctx.db.patch(subscription.userId, {
      subscriptionTier: 'Orca+',
      subscriptionStatus: 'active',
    });

    return { success: true };
  },
});

/* ================================================== */
/* INTERNAL: HANDLE SUBSCRIPTION EXPIRATION */
/* ================================================== */
export const handleExpiration = internalMutation({
  args: {
    originalTransactionId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_transaction', (q) =>
        q.eq('originalTransactionId', args.originalTransactionId),
      )
      .first();

    if (!subscription) return { success: false };

    // Update subscription status
    await ctx.db.patch(subscription._id, {
      status: 'expired',
      willRenew: false,
    });

    // Log expiration event
    await ctx.db.insert('subscriptionEvents', {
      userId: subscription.userId,
      subscriptionId: subscription._id,
      eventType: 'expiration',
      platform: subscription.platform,
      transactionId: subscription.transactionId,
      eventDate: Date.now(),
    });

    // Update user status back to free
    await ctx.db.patch(subscription.userId, {
      subscriptionTier: 'free',
      subscriptionStatus: 'expired',
    });

    // Lock premium courses
    await lockPremiumCourses(ctx, subscription.userId);

    return { success: true };
  },
});

/* ================================================== */
/* INTERNAL: CHECK EXPIRED SUBSCRIPTIONS (CRON) */
/* ================================================== */
export const checkExpiredSubscriptions = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Find all active subscriptions that should be expired
    const subscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect();

    const expiredCount = [];

    for (const sub of subscriptions) {
      if (sub.expirationDate < now && !sub.willRenew) {
        await ctx.db.patch(sub._id, {
          status: 'expired',
        });

        await ctx.db.patch(sub.userId, {
          subscriptionTier: 'free',
          subscriptionStatus: 'expired',
        });

        await lockPremiumCourses(ctx, sub.userId);

        expiredCount.push(sub._id);
      }
    }

    return {
      checkedCount: subscriptions.length,
      expiredCount: expiredCount.length,
    };
  },
});

/* ================================================== */
/* HELPER: UNLOCK PREMIUM COURSES */
/* ================================================== */
async function unlockPremiumCourses(ctx: any, userId: string) {
  const user = await ctx.db.get(userId);
  if (!user?.learningLanguage) return;

  const courses = await ctx.db
    .query('courses')
    .withIndex('by_language', (q: any) =>
      q.eq('language', user.learningLanguage!),
    )
    .filter((q: any) => q.eq(q.field('isPremium'), true))
    .collect();

  for (const course of courses) {
    const progress = await ctx.db
      .query('courseProgress')
      .withIndex('by_user_course', (q: any) =>
        q.eq('userId', userId).eq('courseId', course._id),
      )
      .first();

    if (!progress) {
      await ctx.db.insert('courseProgress', {
        userId,
        courseId: course._id,
        isUnlocked: true,
        isCompleted: false,
      });
    } else if (!progress.isUnlocked) {
      await ctx.db.patch(progress._id, {
        isUnlocked: true,
      });
    }
  }
}

/* ================================================== */
/* HELPER: LOCK PREMIUM COURSES */
/* ================================================== */
async function lockPremiumCourses(ctx: any, userId: string) {
  const user = await ctx.db.get(userId);
  if (!user?.learningLanguage) return;

  const courses = await ctx.db
    .query('courses')
    .withIndex('by_language', (q: any) =>
      q.eq('language', user.learningLanguage!),
    )
    .filter((q: any) => q.eq(q.field('isPremium'), true))
    .collect();

  for (const course of courses) {
    const progress = await ctx.db
      .query('courseProgress')
      .withIndex('by_user_course', (q: any) =>
        q.eq('userId', userId).eq('courseId', course._id),
      )
      .first();

    if (progress && progress.isUnlocked && !progress.isCompleted) {
      await ctx.db.patch(progress._id, {
        isUnlocked: false,
      });
    }
  }
}

/* ================================================== */
/* GET SUBSCRIPTION HISTORY */
/* ================================================== */
export const getSubscriptionHistory = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const events = await ctx.db
      .query('subscriptionEvents')
      .withIndex('by_user', (q: any) => q.eq('userId', userId))
      .order('desc')
      .take(50);

    return events;
  },
});
