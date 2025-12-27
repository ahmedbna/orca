import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query } from './_generated/server';

export const getId = query({
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(authId);

    if (!user) {
      throw new Error('User not found');
    }

    return user._id;
  },
});

export const get = query({
  args: {
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(authId);

    if (!user) {
      throw new Error('User not found');
    }

    const userId = args.userId || user._id;

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

    // Get current course
    let course = null;
    if (user.currentCourse) {
      course = await ctx.db.get(user.currentCourse);
    }

    // Get current lesson
    let lesson = null;
    if (user.currentLesson) {
      lesson = await ctx.db.get(user.currentLesson);
    }

    // Get all courses for the learning language
    let allCourses: any[] = [];
    if (user.learningLanguage) {
      const courses = await ctx.db
        .query('courses')
        .withIndex('by_language', (q) =>
          q.eq('language', user.learningLanguage!)
        )
        .collect();

      const sortedCourses = courses.sort((a, b) => a.order - b.order);

      // Get progress for each course
      allCourses = await Promise.all(
        sortedCourses.map(async (course) => {
          const progress = await ctx.db
            .query('courseProgress')
            .withIndex('by_user_course', (q) =>
              q.eq('userId', userId).eq('courseId', course._id)
            )
            .first();

          return {
            ...course,
            isUnlocked: progress?.isUnlocked || false,
            isCompleted: progress?.isCompleted || false,
            isCurrent: user.currentCourse === course._id,
          };
        })
      );
    }

    // Count completed courses
    const coursesCompleted = allCourses.filter((c) => c.isCompleted).length;

    // Count completed lessons
    const completedLessonProgress = await ctx.db
      .query('lessonProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isCompleted'), true))
      .collect();

    const lessonsCompleted = completedLessonProgress.length;

    const totalWins = wins.length;

    // Get credits
    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    return {
      ...user,
      course,
      lesson,
      allCourses,
      coursesCompleted,
      lessonsCompleted,
      totalWins,
      streak,
      credits: credits?.balance || 0,
    };
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

const getUTCDay = (timestamp = Date.now()) => {
  const d = new Date(timestamp);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
};
