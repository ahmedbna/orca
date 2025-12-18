import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query } from './_generated/server';

export const get = query({
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(authId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
});

export const getbyId = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
});

export const getAll = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const allUser = await ctx.db.query('users').take(100);

    const users = allUser.filter((user) => user._id !== userId);

    return users;
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    gender: v.optional(v.string()),
    birthday: v.optional(v.number()),
    image: v.optional(v.union(v.string(), v.null())),
    nativeLanguage: v.optional(v.string()),
    learningLanguage: v.optional(v.string()),
    currentCourse: v.optional(v.id('courses')),
    currentLesson: v.optional(v.id('lessons')),
    voiceId: v.optional(v.string()),
    agentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return await ctx.db.patch(user._id, {
      ...args,
    });
  },
});
