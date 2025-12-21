import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

const getUTCDay = (timestamp = Date.now()) => {
  const d = new Date(timestamp);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
};

export const getCurrentStreak = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const today = getUTCDay();

    const wins = await ctx.db
      .query('wins')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const days = new Set(wins.map((w) => w.day));

    let streak = 0;
    let cursor = today;

    while (days.has(cursor)) {
      streak++;
      cursor -= 24 * 60 * 60 * 1000;
    }

    return streak;
  },
});

export const getWinHeatmap = query({
  args: {
    yearStart: v.number(),
    yearEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const wins = await ctx.db
      .query('wins')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(
          q.gte(q.field('day'), args.yearStart),
          q.lte(q.field('day'), args.yearEnd)
        )
      )
      .collect();

    const map: Record<number, number> = {};
    for (const w of wins) {
      map[w.day] = (map[w.day] ?? 0) + 1;
    }

    return map;
  },
});

export const recordWin = mutation({
  args: {
    lessonId: v.id('lessons'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) throw new Error('Not authenticated');

    const day = getUTCDay();

    // Prevent duplicate wins (same lesson, same day)
    const existing = await ctx.db
      .query('wins')
      .withIndex('by_user_lesson_day', (q) =>
        q.eq('userId', userId).eq('lessonId', args.lessonId).eq('day', day)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert('wins', {
      userId,
      lessonId: args.lessonId,
      day,
    });
  },
});
