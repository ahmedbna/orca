import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query } from './_generated/server';

export const get = query({
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(authId);

    if (!user) {
      throw new Error('User not found');
    }

    const today = getUTCDay();

    const wins = await ctx.db
      .query('wins')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const days = new Set(wins.map((w) => w.day));

    let streak = 0;
    let cursor = today;

    while (days.has(cursor)) {
      streak++;
      cursor -= 24 * 60 * 60 * 1000;
    }

    // Get current course
    let currentCourse = null;
    if (user.currentCourse) {
      currentCourse = await ctx.db.get(user.currentCourse);
    }

    // Get current lesson
    let currentLesson = null;
    if (user.currentLesson) {
      currentLesson = await ctx.db.get(user.currentLesson);
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
              q.eq('userId', user._id).eq('courseId', course._id)
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
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('isCompleted'), true))
      .collect();

    const lessonsCompleted = completedLessonProgress.length;

    const totalWins = wins.length;

    // Get credits
    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    return {
      ...user,
      currentCourse,
      currentLesson,
      allCourses,
      coursesCompleted,
      lessonsCompleted,
      totalWins,
      streak,
      credits: credits?.balance || 0,
    };
  },
});

export const getbyId = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
});

export const getAll = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const allUser = await ctx.db.query('users').take(100);

    const users = allUser.filter((user) => user._id !== userId);

    return users;
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
