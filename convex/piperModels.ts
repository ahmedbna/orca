// convex/piperModels.ts

import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

// Get all available Piper models
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query('piperModels').collect();
  },
});

// Get models for a specific language
export const getByLanguage = query({
  args: {
    languageCode: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('piperModels')
      .withIndex('by_code', (q) => q.eq('code', args.languageCode))
      .collect();
  },
});

// Get the first (default) model for a language
export const getDefaultForLanguage = query({
  args: {
    languageCode: v.string(),
  },
  handler: async (ctx, args) => {
    const model = await ctx.db
      .query('piperModels')
      .withIndex('by_code', (q) => q.eq('code', args.languageCode))
      .first();

    if (!model) {
      return null;
    }

    return model;
  },
});

// Set user's current voice model
export const setUserVoice = mutation({
  args: {
    piperId: v.id('piperModels'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error('Not authenticated');

    const model = await ctx.db.get(args.piperId);

    if (!model) {
      throw new Error('Model not found');
    }

    await ctx.db.patch(userId, {
      piperId: model._id,
    });

    return { success: true };
  },
});

// Get user's current voice model
export const getUserVoice = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user?.piperId) return null;

    const model = await ctx.db.get(user.piperId);

    if (!model) {
      throw new Error('Model not found');
    }

    return model;
  },
});
