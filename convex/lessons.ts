import { v } from 'convex/values';
import { query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const get = query({
  args: {
    lessonId: v.id('lessons'),
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

    const lesson = await ctx.db.get(args.lessonId);

    if (!lesson) {
      throw new Error('No lesson found');
    }

    const course = await ctx.db.get(lesson.courseId);

    if (!course) {
      throw new Error('No course found for the lesson');
    }

    return {
      ...lesson,
      user,
      course,
    };
  },
});

export const getByCourse = query({
  args: {
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const course = await ctx.db.get(args.courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_course', (q) => q.eq('courseId', args.courseId))
      .collect();

    if (!lessons) {
      throw new Error('No lessons found');
    }

    const lessonWithProgress = await Promise.all(
      lessons.map(async (lesson) => {
        const progress = await ctx.db
          .query('score')
          .withIndex('by_user_lesson', (q) =>
            q.eq('userId', userId).eq('lessonId', lesson._id)
          )
          .first();

        return {
          ...lesson,
          progress,
        };
      })
    );

    return { lessons: lessonWithProgress, course };
  },
});
