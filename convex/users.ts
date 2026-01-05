// users.ts
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query } from './_generated/server';

export const getId = query({
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error('Not authenticated');

    const user = await ctx.db.get(authId);
    if (!user) throw new Error('User not found');

    return user._id;
  },
});

export const get = query({
  args: {
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);
    if (!authId) throw new Error('Not authenticated');

    const user = await ctx.db.get(authId);
    if (!user) throw new Error('User not found');

    const userId = args.userId ?? user._id;

    /* -------------------- streak -------------------- */
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
      cursor -= 86400000;
    }

    /* ---------------- current course ---------------- */
    let course = null;
    let lesson = null;

    if (user.learningLanguage) {
      const courses = await ctx.db
        .query('courses')
        .withIndex('by_language', (q) =>
          q.eq('language', user.learningLanguage!)
        )
        .collect();

      const sortedCourses = courses.sort((a, b) => a.order - b.order);

      const progress = await ctx.db
        .query('courseProgress')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect();

      const currentCourseProgress = progress
        .filter((p) => p.isUnlocked && !p.isCompleted)
        .map((p) => ({
          progress: p,
          course: sortedCourses.find((c) => c._id === p.courseId),
        }))
        .filter((c) => c.course)
        .sort((a, b) => a.course!.order - b.course!.order)[0];

      if (currentCourseProgress) {
        course = currentCourseProgress.course;

        /* ------------ current lesson ------------ */
        const lessons = await ctx.db
          .query('lessons')
          .withIndex('by_course', (q) => q.eq('courseId', course!._id))
          .collect();

        const sortedLessons = lessons.sort((a, b) => a.order - b.order);

        const lessonProgress = await ctx.db
          .query('lessonProgress')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .collect();

        const currentLessonProgress = lessonProgress
          .filter((p) => p.isUnlocked && !p.isCompleted)
          .map((p) => ({
            progress: p,
            lesson: sortedLessons.find((l) => l._id === p.lessonId),
          }))
          .filter((l) => l.lesson)
          .sort((a, b) => a.lesson!.order - b.lesson!.order)[0];

        lesson = currentLessonProgress?.lesson ?? null;
      }
    }

    /* ---------------- all courses ---------------- */
    let allCourses: any[] = [];

    if (user.learningLanguage) {
      const courses = await ctx.db
        .query('courses')
        .withIndex('by_language', (q) =>
          q.eq('language', user.learningLanguage!)
        )
        .collect();

      const sortedCourses = courses.sort((a, b) => a.order - b.order);

      allCourses = await Promise.all(
        sortedCourses.map(async (c) => {
          const progress = await ctx.db
            .query('courseProgress')
            .withIndex('by_user_course', (q) =>
              q.eq('userId', userId).eq('courseId', c._id)
            )
            .first();

          return {
            ...c,
            isUnlocked: progress?.isUnlocked ?? false,
            isCompleted: progress?.isCompleted ?? false,
            isCurrent: course?._id === c._id,
          };
        })
      );
    }

    const coursesCompleted = allCourses.filter((c) => c.isCompleted).length;

    const lessonsCompleted = await ctx.db
      .query('lessonProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isCompleted'), true))
      .collect()
      .then((l) => l.length);

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
      totalWins: wins.length,
      streak,
      credits: credits?.balance ?? 0,
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
    voiceId: v.optional(v.string()),
    agentId: v.optional(v.string()),
    piperId: v.optional(v.id('piperModels')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    return ctx.db.patch(userId, args);
  },
});

const getUTCDay = (timestamp = Date.now()) => {
  const d = new Date(timestamp);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
};
