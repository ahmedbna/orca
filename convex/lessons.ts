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

    // Check if lesson is unlocked
    const lessonProgress = await ctx.db
      .query('lessonProgress')
      .withIndex('by_user_lesson', (q) =>
        q.eq('userId', userId).eq('lessonId', args.lessonId)
      )
      .first();

    const isUnlocked = lessonProgress?.isUnlocked || false;

    if (!isUnlocked) {
      throw new Error('Lesson is locked');
    }

    return {
      ...lesson,
      user,
      course,
      score: lessonProgress?.score || 0,
      isUnlocked,
      isCompleted: lessonProgress?.isCompleted || false,
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

    const user = await ctx.db.get(userId);

    if (!user) {
      throw new Error('User not found');
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

    // Sort lessons by order
    const sortedLessons = lessons.sort((a, b) => a.order - b.order);

    const currentLessonId = user.currentLesson;
    const currentCourseId = user.currentCourse;
    const isCurrent = currentCourseId && course._id === currentCourseId;

    const lessonWithProgress = await Promise.all(
      sortedLessons.map(async (lesson) => {
        const lessonProgress = await ctx.db
          .query('lessonProgress')
          .withIndex('by_user_lesson', (q) =>
            q.eq('userId', userId).eq('lessonId', lesson._id)
          )
          .first();

        // Determine status
        let status: 'locked' | 'active' | 'completed';

        if (lessonProgress?.isCompleted) {
          status = 'completed';
        } else if (
          isCurrent &&
          currentLessonId &&
          lesson._id === currentLessonId
        ) {
          status = 'active';
        } else if (lessonProgress?.isUnlocked) {
          status = 'active';
        } else {
          status = 'locked';
        }

        return {
          ...lesson,
          score: lessonProgress?.score || 0,
          isUnlocked: lessonProgress?.isUnlocked || false,
          isCompleted: lessonProgress?.isCompleted || false,
          status,
        };
      })
    );

    return { lessons: lessonWithProgress, course };
  },
});
