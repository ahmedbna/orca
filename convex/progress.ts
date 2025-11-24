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

    const progress = await ctx.db
      .query('progress')
      .withIndex('by_user_lesson', (q) =>
        q.eq('userId', userId).eq('lessonId', args.lessonId)
      )
      .first();

    return progress;
  },
});

export const add = internalMutation({
  args: {
    userId: v.id('users'),
    lessonId: v.id('lessons'),
    progress: v.string(),
  },
  handler: async (ctx, args) => {
    const phrases = args.progress
      .split('|')
      .map((phrase) => phrase.trim())
      .filter(Boolean);

    const lesson = await ctx.db.get(args.lessonId);

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const lessonPhrases: string[] = lesson.phrases.map((p) => p.text);

    const matchedPhrases = phrases.filter((phrase) =>
      lessonPhrases.includes(phrase)
    );

    const matchedCount = matchedPhrases.length;

    const score =
      lessonPhrases.length === 0
        ? 0
        : Math.round((matchedCount / lessonPhrases.length) * 100) / 100;

    const progress = await ctx.db
      .query('progress')
      .withIndex('by_lesson', (q) => q.eq('lessonId', args.lessonId))
      .first();

    if (!progress) {
      await ctx.db.insert('progress', {
        userId: args.userId,
        lessonId: args.lessonId,
        phrases,
        score,
      });
    } else if (progress.score < score) {
      await ctx.db.patch(progress._id, {
        score,
      });
    }
  },
});
