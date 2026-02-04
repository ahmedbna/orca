// convex/home.ts
import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from './_generated/server';

export const getHomeData = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user?.learningLanguage) {
      throw new Error('Select language first');
    }

    const today = getUTCDay();
    const thirtyDaysAgo = today - 30 * 24 * 60 * 60 * 1000;

    // Fetch everything in parallel
    const [courses, courseProgress, allLessons, lessonProgress, completions] =
      await Promise.all([
        ctx.db
          .query('courses')
          .withIndex('by_language', (q) =>
            q.eq('language', user.learningLanguage!),
          )
          .collect(),
        ctx.db
          .query('courseProgress')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .collect(),
        ctx.db.query('lessons').collect(),
        ctx.db
          .query('lessonProgress')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .collect(),
        ctx.db
          .query('completions')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .filter((q) => q.gte(q.field('day'), thirtyDaysAgo))
          .collect(),
      ]);

    const sortedCourses = courses.sort((a, b) => a.order - b.order);

    // Find current course
    const currentCourseProgress = courseProgress
      .filter((p) => p.isUnlocked && !p.isCompleted)
      .map((p) => ({
        progress: p,
        course: sortedCourses.find((c) => c._id === p.courseId),
      }))
      .filter((c) => c.course)
      .sort((a, b) => a.course!.order - b.course!.order)[0];

    if (!currentCourseProgress) {
      throw new Error('No active course');
    }

    const course = currentCourseProgress.course!;

    // Process lessons
    const courseLessons = allLessons
      .filter((l) => l.courseId === course._id)
      .sort((a, b) => a.order - b.order);

    const lessonsWithStatus = courseLessons.map((lesson) => {
      const progress = lessonProgress.find((p) => p.lessonId === lesson._id);
      let status: 'locked' | 'active' | 'completed' = 'locked';
      if (progress?.isCompleted) status = 'completed';
      else if (progress?.isUnlocked) status = 'active';
      return { ...lesson, status };
    });

    // Calculate streak
    const days = new Set(completions.map((c) => c.day));
    let streak = 0;
    let cursor = today;
    while (days.has(cursor) && streak < 365) {
      streak++;
      cursor -= 24 * 60 * 60 * 1000;
    }

    return {
      course: {
        ...course,
        lessons: lessonsWithStatus,
      },
      streak,
    };
  },
});

const getUTCDay = (timestamp = Date.now()) => {
  const d = new Date(timestamp);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
};
