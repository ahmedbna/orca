import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from './_generated/server';

export const getCourse = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);

    if (!user) {
      throw new Error('Not found');
    }

    const currentCourse = user.currentCourse;
    if (!currentCourse) {
      throw new Error('Select language first');
    }

    const course = await ctx.db.get(currentCourse);

    if (!course) {
      throw new Error('No course found');
    }

    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_course', (q) => q.eq('courseId', course._id))
      .collect();

    if (!lessons) {
      throw new Error('No lessons found');
    }

    const score = await Promise.all(
      lessons.map(async (lesson) => {
        const score = await ctx.db
          .query('score')
          .withIndex('by_user_lesson', (q) =>
            q.eq('userId', userId).eq('lessonId', lesson._id)
          )
          .first();

        return {
          ...lesson,
          score: score ? score : undefined,
        };
      })
    );

    return {
      ...course,
      lessons: score,
    };
  },
});

export const getAll = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);

    if (!user) {
      throw new Error('Not found');
    }

    const learningLanguage = user.learningLanguage;
    if (!learningLanguage) {
      throw new Error('Select language first');
    }

    const courses = await ctx.db
      .query('courses')
      .withIndex('by_language', (q) => q.eq('language', learningLanguage))
      .collect();

    if (!courses) {
      throw new Error('No courses found for the selected language');
    }

    return courses;
  },
});
