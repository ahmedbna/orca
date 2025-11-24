import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { internalMutation, query } from './_generated/server';

export const get = query({
  args: {
    lessonId: v.id('lessons'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_user_lesson', (q) =>
        q.eq('userId', userId).eq('lessonId', args.lessonId)
      )
      .collect();

    return conversations;
  },
});

export const add = internalMutation({
  args: {
    userId: v.id('users'),
    studentId: v.id('students'),
    lessonId: v.id('lessons'),
    agentId: v.string(),
    conversationId: v.string(),
    duration: v.number(),
    cost: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('conversations', {
      ...args,
    });

    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!credits) {
      throw new Error('Credits not found');
    }

    const balance = credits.balance - args.duration;

    await ctx.db.patch(credits._id, {
      balance,
    });
  },
});
