// convex/completions.ts
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

/* -------------------------------------------------- */
/* GET LEADERBOARD FOR A LESSON */
/* -------------------------------------------------- */
export const getLeaderboard = query({
  args: {
    lessonId: v.id('lessons'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const completions = await ctx.db
      .query('completions')
      .withIndex('by_lesson', (q) => q.eq('lessonId', args.lessonId))
      .collect();

    // // Get all perfect completions (allCorrect = true) for this lesson
    // const completions = await ctx.db
    //   .query('completions')
    //   .withIndex('by_lesson', (q) => q.eq('lessonId', args.lessonId))
    //   .filter((q) => q.eq(q.field('allCorrect'), true))
    //   .collect();

    // Group by user and get the best (lowest) time for each user
    const userBestScores = new Map<string, any>();

    for (const completion of completions) {
      const existing = userBestScores.get(completion.userId);

      if (!existing || completion.time < existing.time) {
        const user = await ctx.db.get(completion.userId);

        if (user) {
          userBestScores.set(completion.userId, {
            userId: completion.userId,
            time: completion.time,
            name: user.name || 'Anonymous',
            image: user.image || null,
            createdAt: completion._creationTime,
          });
        }
      }
    }

    // Convert to array and sort by time (ascending)
    const leaderboard = Array.from(userBestScores.values())
      .sort((a, b) => a.time - b.time)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return leaderboard;
  },
});

/* -------------------------------------------------- */
/* GET CURRENT STREAK */
/* -------------------------------------------------- */
export const getCurrentStreak = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const today = getUTCDay();
    const thirtyDaysAgo = today - 30 * 24 * 60 * 60 * 1000;

    const completions = await ctx.db
      .query('completions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.gte(q.field('day'), thirtyDaysAgo))
      .collect();

    const days = new Set(completions.map((c) => c.day));

    let streak = 0;
    let cursor = today;

    while (days.has(cursor) && streak < 365) {
      streak++;
      cursor -= 24 * 60 * 60 * 1000;
    }

    return streak;
  },
});

/* -------------------------------------------------- */
/* GET WIN HEATMAP */
/* -------------------------------------------------- */
export const getWinHeatmap = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const today = new Date();
    const year = today.getFullYear();

    const { start, end } = getYearRange(year);

    const completions = await ctx.db
      .query('completions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(q.gte(q.field('day'), start), q.lte(q.field('day'), end)),
      )
      .collect();

    const map: Record<number, number> = {};
    for (const c of completions) {
      map[c.day] = (map[c.day] ?? 0) + 1;
    }

    return map;
  },
});

/* -------------------------------------------------- */
/* RECORD COMPLETION */
/* -------------------------------------------------- */
export const recordCompletion = mutation({
  args: {
    lessonId: v.id('lessons'),
    time: v.number(),
    correctPhrases: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error('Lesson not found');

    const totalPhrases = lesson.phrases.length;
    const allCorrect = args.correctPhrases === totalPhrases;
    const day = getUTCDay();

    // Always record the completion
    const completionId = await ctx.db.insert('completions', {
      userId,
      lessonId: args.lessonId,
      time: args.time,
      correctPhrases: args.correctPhrases,
      totalPhrases,
      allCorrect,
      day,
    });

    return {
      success: true,
      allCorrect,
      completionId,
    };
  },
});

/* -------------------------------------------------- */
/* GET USER STATS */
/* -------------------------------------------------- */
export const getUserStats = query({
  args: {
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error('Not authenticated');

    const userId = args.userId ?? authId;

    const completions = await ctx.db
      .query('completions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const today = getUTCDay();
    const days = new Set(completions.map((c) => c.day));

    let streak = 0;
    let cursor = today;
    while (days.has(cursor) && streak < 365) {
      streak++;
      cursor -= 24 * 60 * 60 * 1000;
    }

    return {
      totalCompletions: completions.length,
      perfectCompletions: completions.filter((c) => c.allCorrect).length,
      streak,
      totalWins: completions.length,
    };
  },
});

/* -------------------------------------------------- */
/* HELPER FUNCTIONS */
/* -------------------------------------------------- */
const getUTCDay = (timestamp = Date.now()) => {
  const d = new Date(timestamp);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
};

const getYearRange = (year: number) => {
  return {
    start: Date.UTC(year, 0, 1),
    end: Date.UTC(year, 11, 31),
  };
};
