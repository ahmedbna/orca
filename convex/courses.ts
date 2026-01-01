import { getAuthUserId } from '@convex-dev/auth/server';
import { query, mutation } from './_generated/server';

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

    const learningLanguage = user.learningLanguage;

    if (!learningLanguage) {
      throw new Error('Select language first');
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

    const sortedLessons = lessons.sort((a, b) => a.order - b.order);

    const currentLessonId = user.currentLesson;

    const lessonsWithStatus = await Promise.all(
      sortedLessons.map(async (lesson) => {
        const lessonProgress = await ctx.db
          .query('lessonProgress')
          .withIndex('by_user_lesson', (q) =>
            q.eq('userId', userId).eq('lessonId', lesson._id)
          )
          .first();

        let status: 'locked' | 'active' | 'completed';

        if (lessonProgress?.isCompleted) {
          status = 'completed';
        } else if (currentLessonId && lesson._id === currentLessonId) {
          status = 'active';
        } else if (lessonProgress?.isUnlocked) {
          status = 'active';
        } else {
          status = 'locked';
        }

        return {
          ...lesson,
          status,
        };
      })
    );

    return {
      ...course,
      lessons: lessonsWithStatus,
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

    const sortedCourses = courses.sort((a, b) => a.order - b.order);

    const currentCourseId = user.currentCourse;

    const coursesWithProgress = await Promise.all(
      sortedCourses.map(async (course) => {
        const progress = await ctx.db
          .query('courseProgress')
          .withIndex('by_user_course', (q) =>
            q.eq('userId', userId).eq('courseId', course._id)
          )
          .first();

        const isUnlocked = progress?.isUnlocked || false;
        const isCompleted = progress?.isCompleted || false;
        const isCurrent = currentCourseId && course._id === currentCourseId;

        return {
          ...course,
          isUnlocked,
          isCompleted,
          isCurrent,
        };
      })
    );

    return coursesWithProgress;
  },
});

// Initialize user progress
export const initializeProgress = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

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

    const existingCourseProgress = await ctx.db
      .query('courseProgress')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', userId).eq('courseId', firstCourse._id)
      )
      .first();

    if (existingCourseProgress) {
      return { success: true, message: 'Already initialized' };
    }

    await ctx.db.insert('courseProgress', {
      userId,
      courseId: firstCourse._id,
      isUnlocked: true,
      isCompleted: false,
    });

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

    await ctx.db.patch(userId, {
      currentCourse: firstCourse._id,
      currentLesson: firstLesson._id,
    });

    return { success: true, message: 'Progress initialized' };
  },
});
