import { query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const get = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const students = await ctx.db
      .query('students')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!students) {
      throw new Error('No enrollments found');
    }

    const courses = await ctx.db
      .query('courses')
      .withIndex('by_language', (q) =>
        q.eq('language.code', students.learningLanguage.code)
      )
      .collect();

    if (!courses) {
      throw new Error('No courses found for the selected language');
    }

    return courses;
  },
});
