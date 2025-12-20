import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

// Get leaderboard for a specific lesson
export const getLeaderboard = query({
  args: {
    lessonId: v.id('lessons'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get all scores for this lesson where all phrases were correct
    const scores = await ctx.db
      .query('scores')
      .withIndex('by_lesson', (q) => q.eq('lessonId', args.lessonId))
      .filter((q) => q.eq(q.field('allCorrect'), true))
      .collect();

    // Group by user and get the best (lowest) time for each user
    const userBestScores = new Map<string, any>();

    for (const score of scores) {
      const existing = userBestScores.get(score.userId);

      if (!existing || score.time < existing.time) {
        const user = await ctx.db.get(score.userId);

        if (user) {
          userBestScores.set(score.userId, {
            userId: score.userId,
            time: score.time,
            name: user.name || 'Anonymous',
            image: user.image || null,
            createdAt: score._creationTime,
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

// Submit a score for a lesson
export const submitScore = mutation({
  args: {
    lessonId: v.id('lessons'),
    time: v.number(),
    correctPhrases: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const lesson = await ctx.db.get(args.lessonId);

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const totalPhrases = lesson.phrases.length;
    const allCorrect = args.correctPhrases === totalPhrases;

    // Only save to leaderboard if all phrases were correct
    if (allCorrect) {
      // Check if user already has a score for this lesson
      const existingScores = await ctx.db
        .query('scores')
        .withIndex('by_user_lesson', (q) =>
          q.eq('userId', userId).eq('lessonId', args.lessonId)
        )
        .collect();

      // Find the best existing score
      const bestExistingScore = existingScores
        .filter((s) => s.allCorrect)
        .sort((a, b) => a.time - b.time)[0];

      // Only insert if this is a new best time or first completion
      if (!bestExistingScore || args.time < bestExistingScore.time) {
        await ctx.db.insert('scores', {
          userId,
          lessonId: args.lessonId,
          time: args.time,
          correctPhrases: args.correctPhrases,
          totalPhrases,
          allCorrect: true,
        });
      }
    }

    return { success: true, allCorrect };
  },
});
