// courses.ts
import { getAuthUserId } from '@convex-dev/auth/server';
import { query, mutation } from './_generated/server';

// convex/courses.ts
export const getCourse = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user?.learningLanguage) {
      throw new Error('Select language first');
    }

    // Fetch all data in parallel
    const [courses, courseProgress, allLessons, lessonProgress] =
      await Promise.all([
        ctx.db
          .query('courses')
          .withIndex('by_language', (q) =>
            q.eq('language', user.learningLanguage!)
          )
          .collect(),
        ctx.db
          .query('courseProgress')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .collect(),
        ctx.db.query('lessons').collect(), // Get all lessons at once
        ctx.db
          .query('lessonProgress')
          .withIndex('by_user', (q) => q.eq('userId', userId))
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

    // Filter lessons for current course (no extra query needed)
    const courseLessons = allLessons
      .filter((l) => l.courseId === course._id)
      .sort((a, b) => a.order - b.order);

    const lessonsWithStatus = courseLessons.map((lesson) => {
      const progress = lessonProgress.find((p) => p.lessonId === lesson._id);

      let status: 'locked' | 'active' | 'completed' = 'locked';
      if (progress?.isCompleted) {
        status = 'completed';
      } else if (progress?.isUnlocked) {
        status = 'active';
      }

      return {
        ...lesson,
        status,
      };
    });

    return {
      ...course,
      lessons: lessonsWithStatus,
    };
  },
});

/* -------------------------------------------------- */
/* GET ALL COURSES */
/* -------------------------------------------------- */
export const getAll = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('Not found');

    if (!user.learningLanguage) {
      throw new Error('Select language first');
    }

    const courses = await ctx.db
      .query('courses')
      .withIndex('by_language', (q) => q.eq('language', user.learningLanguage!))
      .collect();

    const sortedCourses = courses.sort((a, b) => a.order - b.order);

    const progressList = await ctx.db
      .query('courseProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    /* ---------- determine current course ---------- */
    const currentCourseId =
      progressList
        .filter((p) => p.isUnlocked && !p.isCompleted)
        .map((p) => {
          const course = sortedCourses.find((c) => c._id === p.courseId);
          return course ? { id: course._id, order: course.order } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a!.order - b!.order)[0]?.id ?? null;

    const coursesWithProgress = sortedCourses.map((course) => {
      const progress = progressList.find((p) => p.courseId === course._id);

      return {
        ...course,
        isUnlocked: progress?.isUnlocked ?? false,
        isCompleted: progress?.isCompleted ?? false,
        isCurrent: course._id === currentCourseId,
      };
    });

    return coursesWithProgress;
  },
});

/* -------------------------------------------------- */
/* INITIALIZE PROGRESS */
/* -------------------------------------------------- */
export const initializeProgress = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    if (!user.learningLanguage) {
      throw new Error('Please select a learning language first');
    }

    const firstCourse = await ctx.db
      .query('courses')
      .withIndex('by_language_order', (q) =>
        q.eq('language', user.learningLanguage!).eq('order', 1)
      )
      .first();

    if (!firstCourse) {
      throw new Error('No courses available for this language');
    }

    const existing = await ctx.db
      .query('courseProgress')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', userId).eq('courseId', firstCourse._id)
      )
      .first();

    if (existing) {
      return { success: true, message: 'Already initialized' };
    }

    /* ---------- unlock first course ---------- */
    await ctx.db.insert('courseProgress', {
      userId,
      courseId: firstCourse._id,
      isUnlocked: true,
      isCompleted: false,
    });

    /* ---------- unlock first lesson ---------- */
    const firstLesson = await ctx.db
      .query('lessons')
      .withIndex('by_course_order', (q) =>
        q.eq('courseId', firstCourse._id).eq('order', 1)
      )
      .first();

    if (!firstLesson) {
      throw new Error('No lessons found for this course');
    }

    await ctx.db.insert('lessonProgress', {
      userId,
      lessonId: firstLesson._id,
      isUnlocked: true,
      isCompleted: false,
    });

    return { success: true, message: 'Progress initialized' };
  },
});
