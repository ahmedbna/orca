import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const get = query({
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', authId))
      .first();

    if (!credits) {
      throw new Error('Credits not found');
    }

    return credits;
  },
});

export const add = mutation({
  args: {
    balance: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!credits) {
      throw new Error('Credits not found');
    }

    await ctx.db.patch(credits._id, {
      ...args,
    });
  },
});

export const create = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (credits) {
      throw new Error('User already have credits');
    }

    const creditsId = await ctx.db.insert('credits', {
      userId,
      balance: 300,
    });

    return creditsId;
  },
});
