// lessons.ts
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

/* -------------------------------------------------- */
/* GET SINGLE LESSON */
/* -------------------------------------------------- */
export const get = query({
  args: {
    lessonId: v.id('lessons'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('No user found');

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error('No lesson found');

    const course = await ctx.db.get(lesson.courseId);
    if (!course) throw new Error('No course found for the lesson');

    const lessonProgress = await ctx.db
      .query('lessonProgress')
      .withIndex('by_user_lesson', (q) =>
        q.eq('userId', userId).eq('lessonId', lesson._id)
      )
      .first();

    if (!lessonProgress?.isUnlocked) {
      throw new Error('Lesson is locked');
    }

    return {
      ...lesson,
      user,
      course,
      isUnlocked: true,
      isCompleted: lessonProgress.isCompleted,
    };
  },
});

/* -------------------------------------------------- */
/* GET LESSONS BY COURSE */
/* -------------------------------------------------- */
export const getByCourse = query({
  args: {
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error('Course not found');

    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_course', (q) => q.eq('courseId', args.courseId))
      .collect();

    const sortedLessons = lessons.sort((a, b) => a.order - b.order);

    const lessonProgressList = await ctx.db
      .query('lessonProgress')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const lessonsWithProgress = sortedLessons.map((lesson) => {
      const progress = lessonProgressList.find(
        (p) => p.lessonId === lesson._id
      );

      let status: 'locked' | 'active' | 'completed' = 'locked';

      if (progress?.isCompleted) {
        status = 'completed';
      } else if (progress?.isUnlocked) {
        status = 'active';
      }

      return {
        ...lesson,
        isUnlocked: progress?.isUnlocked ?? false,
        isCompleted: progress?.isCompleted ?? false,
        status,
      };
    });

    return {
      course,
      lessons: lessonsWithProgress,
    };
  },
});

/* -------------------------------------------------- */
/* COMPLETE LESSON */
/* -------------------------------------------------- */
export const completeLesson = mutation({
  args: {
    lessonId: v.id('lessons'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error('Lesson not found');

    const course = await ctx.db.get(lesson.courseId);
    if (!course) throw new Error('Course not found');

    /* ---------- mark lesson completed ---------- */
    const lessonProgress = await ctx.db
      .query('lessonProgress')
      .withIndex('by_user_lesson', (q) =>
        q.eq('userId', userId).eq('lessonId', lesson._id)
      )
      .first();

    if (lessonProgress) {
      await ctx.db.patch(lessonProgress._id, {
        isCompleted: true,
      });
    } else {
      await ctx.db.insert('lessonProgress', {
        userId,
        lessonId: lesson._id,
        isUnlocked: true,
        isCompleted: true,
      });
    }

    /* ---------- find next lesson ---------- */
    const allLessons = await ctx.db
      .query('lessons')
      .withIndex('by_course', (q) => q.eq('courseId', course._id))
      .collect();

    const sortedLessons = allLessons.sort((a, b) => a.order - b.order);
    const currentIndex = sortedLessons.findIndex((l) => l._id === lesson._id);
    const nextLesson = sortedLessons[currentIndex + 1];

    /* ---------- unlock next lesson ---------- */
    if (nextLesson) {
      const nextProgress = await ctx.db
        .query('lessonProgress')
        .withIndex('by_user_lesson', (q) =>
          q.eq('userId', userId).eq('lessonId', nextLesson._id)
        )
        .first();

      if (!nextProgress) {
        await ctx.db.insert('lessonProgress', {
          userId,
          lessonId: nextLesson._id,
          isUnlocked: true,
          isCompleted: false,
        });
      } else if (!nextProgress.isUnlocked) {
        await ctx.db.patch(nextProgress._id, {
          isUnlocked: true,
        });
      }

      return { success: true };
    }

    /* ---------- course completion ---------- */
    const allProgress = await Promise.all(
      sortedLessons.map((l) =>
        ctx.db
          .query('lessonProgress')
          .withIndex('by_user_lesson', (q) =>
            q.eq('userId', userId).eq('lessonId', l._id)
          )
          .first()
      )
    );

    const allCompleted = allProgress.every((p) => p?.isCompleted);
    if (!allCompleted) return { success: true };

    /* ---------- mark course completed ---------- */
    const courseProgress = await ctx.db
      .query('courseProgress')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', userId).eq('courseId', course._id)
      )
      .first();

    if (courseProgress) {
      await ctx.db.patch(courseProgress._id, { isCompleted: true });
    } else {
      await ctx.db.insert('courseProgress', {
        userId,
        courseId: course._id,
        isUnlocked: true,
        isCompleted: true,
      });
    }

    /* ---------- unlock next course ---------- */
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_language', (q) => q.eq('language', course.language))
      .collect();

    const sortedCourses = courses.sort((a, b) => a.order - b.order);
    const courseIndex = sortedCourses.findIndex((c) => c._id === course._id);
    const nextCourse = sortedCourses[courseIndex + 1];

    if (!nextCourse) return { success: true };

    const nextCourseProgress = await ctx.db
      .query('courseProgress')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', userId).eq('courseId', nextCourse._id)
      )
      .first();

    if (!nextCourseProgress) {
      await ctx.db.insert('courseProgress', {
        userId,
        courseId: nextCourse._id,
        isUnlocked: true,
        isCompleted: false,
      });
    } else if (!nextCourseProgress.isUnlocked) {
      await ctx.db.patch(nextCourseProgress._id, {
        isUnlocked: true,
      });
    }

    /* ---------- unlock first lesson of next course ---------- */
    const firstLesson = await ctx.db
      .query('lessons')
      .withIndex('by_course_order', (q) =>
        q.eq('courseId', nextCourse._id).eq('order', 1)
      )
      .first();

    if (firstLesson) {
      const firstProgress = await ctx.db
        .query('lessonProgress')
        .withIndex('by_user_lesson', (q) =>
          q.eq('userId', userId).eq('lessonId', firstLesson._id)
        )
        .first();

      if (!firstProgress) {
        await ctx.db.insert('lessonProgress', {
          userId,
          lessonId: firstLesson._id,
          isUnlocked: true,
          isCompleted: false,
        });
      }
    }

    return { success: true };
  },
});
