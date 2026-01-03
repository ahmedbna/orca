// convex/userDeletion.ts
import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

const DELETION_GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/* -------------------------------------------------- */
/* REQUEST ACCOUNT DELETION */
/* -------------------------------------------------- */
export const requestDeletion = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    // Mark user for deletion
    const deletionDate = Date.now() + DELETION_GRACE_PERIOD_MS;

    await ctx.db.patch(userId, {
      scheduledForDeletion: deletionDate,
    });

    return {
      success: true,
      deletionDate,
      message:
        'Account scheduled for deletion in 30 days. Log in again to cancel.',
    };
  },
});

/* -------------------------------------------------- */
/* CANCEL DELETION (automatic on login) */
/* -------------------------------------------------- */
export const cancelDeletion = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    // Remove deletion schedule if exists
    if (user.scheduledForDeletion) {
      await ctx.db.patch(userId, {
        scheduledForDeletion: undefined,
      });
    }

    return { success: true, message: 'Account deletion cancelled' };
  },
});

/* -------------------------------------------------- */
/* CHECK DELETION STATUS */
/* -------------------------------------------------- */
export const getDeletionStatus = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    if (!user.scheduledForDeletion) {
      return {
        isScheduled: false,
        deletionDate: null,
        daysRemaining: null,
      };
    }

    const now = Date.now();
    const daysRemaining = Math.ceil(
      (user.scheduledForDeletion - now) / (24 * 60 * 60 * 1000)
    );

    return {
      isScheduled: true,
      deletionDate: user.scheduledForDeletion,
      daysRemaining: Math.max(0, daysRemaining),
    };
  },
});

/* -------------------------------------------------- */
/* DELETE USER AND ALL ASSOCIATED DATA */
/* -------------------------------------------------- */
export const deleteUserData = internalMutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      console.log(`User ${args.userId} not found, skipping deletion`);
      return { success: false, reason: 'User not found' };
    }

    // Delete credits
    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    for (const credit of credits) {
      await ctx.db.delete(credit._id);
    }

    // Delete conversations
    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    for (const conversation of conversations) {
      await ctx.db.delete(conversation._id);
    }

    // Delete course progress
    const courseProgress = await ctx.db
      .query('courseProgress')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    for (const progress of courseProgress) {
      await ctx.db.delete(progress._id);
    }

    // Delete lesson progress
    const lessonProgress = await ctx.db
      .query('lessonProgress')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    for (const progress of lessonProgress) {
      await ctx.db.delete(progress._id);
    }

    // Delete scores
    const scores = await ctx.db
      .query('scores')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    for (const score of scores) {
      await ctx.db.delete(score._id);
    }

    // Delete wins
    const wins = await ctx.db
      .query('wins')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    for (const win of wins) {
      await ctx.db.delete(win._id);
    }

    // Delete auth-related data
    const authSessions = await ctx.db
      .query('authSessions')
      .withIndex('userId', (q) => q.eq('userId', args.userId))
      .collect();

    for (const session of authSessions) {
      await ctx.db.delete(session._id);
    }

    const authAccounts = await ctx.db
      .query('authAccounts')
      .withIndex('userIdAndProvider', (q) => q.eq('userId', args.userId))
      .collect();

    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    // Finally, delete the user
    await ctx.db.delete(args.userId);

    console.log(
      `Successfully deleted user ${args.userId} and all associated data`
    );

    return {
      success: true,
      deletedRecords: {
        credits: credits.length,
        conversations: conversations.length,
        courseProgress: courseProgress.length,
        lessonProgress: lessonProgress.length,
        scores: scores.length,
        wins: wins.length,
        authSessions: authSessions.length,
        authAccounts: authAccounts.length,
      },
    };
  },
});

/* -------------------------------------------------- */
/* CLEANUP SCHEDULED DELETIONS (run via cron) */
/* -------------------------------------------------- */
export const cleanupScheduledDeletions = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Find all users scheduled for deletion where the grace period has passed
    const users = await ctx.db.query('users').collect();

    const usersToDelete = users.filter(
      (user) => user.scheduledForDeletion && user.scheduledForDeletion <= now
    );

    console.log(`Found ${usersToDelete.length} users to delete`);

    const results = [];

    for (const user of usersToDelete) {
      try {
        // Since we can't directly call internal mutations from internal mutations,
        // we'll delete inline
        await deleteUserDataInline(ctx, user._id);

        results.push({
          userId: user._id,
          email: user.email,
          success: true,
        });
      } catch (error) {
        console.error(`Failed to delete user ${user._id}:`, error);
        results.push({
          userId: user._id,
          email: user.email,
          success: false,
          error: String(error),
        });
      }
    }

    return {
      deletedCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      results,
    };
  },
});

// Helper function to delete user data inline
async function deleteUserDataInline(ctx: any, userId: string) {
  // Delete credits
  const credits = await ctx.db
    .query('credits')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
    .collect();
  for (const credit of credits) {
    await ctx.db.delete(credit._id);
  }

  // Delete conversations
  const conversations = await ctx.db
    .query('conversations')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
    .collect();
  for (const conversation of conversations) {
    await ctx.db.delete(conversation._id);
  }

  // Delete course progress
  const courseProgress = await ctx.db
    .query('courseProgress')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
    .collect();
  for (const progress of courseProgress) {
    await ctx.db.delete(progress._id);
  }

  // Delete lesson progress
  const lessonProgress = await ctx.db
    .query('lessonProgress')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
    .collect();
  for (const progress of lessonProgress) {
    await ctx.db.delete(progress._id);
  }

  // Delete scores
  const scores = await ctx.db
    .query('scores')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
    .collect();
  for (const score of scores) {
    await ctx.db.delete(score._id);
  }

  // Delete wins
  const wins = await ctx.db
    .query('wins')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
    .collect();
  for (const win of wins) {
    await ctx.db.delete(win._id);
  }

  // Delete auth-related data
  const authSessions = await ctx.db
    .query('authSessions')
    .withIndex('userId', (q: any) => q.eq('userId', userId))
    .collect();
  for (const session of authSessions) {
    await ctx.db.delete(session._id);
  }

  const authAccounts = await ctx.db
    .query('authAccounts')
    .withIndex('userIdAndProvider', (q: any) => q.eq('userId', userId))
    .collect();
  for (const account of authAccounts) {
    await ctx.db.delete(account._id);
  }

  // Finally, delete the user
  await ctx.db.delete(userId);
}

export const checkAndCancelDeletionOnLogin = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { cancelled: false, message: 'Not authenticated' };

    const user = await ctx.db.get(userId);
    if (!user) return { cancelled: false, message: 'User not found' };

    // Check if user has a scheduled deletion
    if (user.scheduledForDeletion) {
      // Cancel the deletion
      await ctx.db.patch(userId, {
        scheduledForDeletion: undefined,
      });

      return {
        cancelled: true,
        message: 'Welcome back! Your account deletion has been cancelled.',
      };
    }

    return { cancelled: false, message: 'No deletion scheduled' };
  },
});
