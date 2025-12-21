import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
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
          isUnlocked: lessonProgress?.isUnlocked || false,
          isCompleted: lessonProgress?.isCompleted || false,
          status,
        };
      })
    );

    return { lessons: lessonWithProgress, course };
  },
});

// Complete a lesson and update progress
export const completeLesson = mutation({
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
      throw new Error('Lesson not found');
    }

    const course = await ctx.db.get(lesson.courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Update or create lesson progress
    const lessonProgress = await ctx.db
      .query('lessonProgress')
      .withIndex('by_user_lesson', (q) =>
        q.eq('userId', userId).eq('lessonId', args.lessonId)
      )
      .first();

    if (lessonProgress) {
      await ctx.db.patch(lessonProgress._id, {
        isCompleted: lessonProgress.isCompleted,
      });
    } else {
      await ctx.db.insert('lessonProgress', {
        userId,
        lessonId: args.lessonId,
        isUnlocked: true,
        isCompleted: true,
      });
    }

    const allLessons = await ctx.db
      .query('lessons')
      .withIndex('by_course', (q) => q.eq('courseId', lesson.courseId))
      .collect();

    const sortedLessons = allLessons.sort((a, b) => a.order - b.order);
    const currentIndex = sortedLessons.findIndex((l) => l._id === lesson._id);
    const nextLesson = sortedLessons[currentIndex + 1];

    if (nextLesson) {
      // Unlock next lesson in current course
      const nextLessonProgress = await ctx.db
        .query('lessonProgress')
        .withIndex('by_user_lesson', (q) =>
          q.eq('userId', userId).eq('lessonId', nextLesson._id)
        )
        .first();

      if (!nextLessonProgress) {
        await ctx.db.insert('lessonProgress', {
          userId,
          lessonId: nextLesson._id,
          isUnlocked: true,
          isCompleted: false,
        });
      } else if (!nextLessonProgress.isUnlocked) {
        await ctx.db.patch(nextLessonProgress._id, {
          isUnlocked: true,
        });
      }

      // Update current lesson pointer
      await ctx.db.patch(userId, {
        currentLesson: nextLesson._id,
      });
    } else {
      // No more lessons in course - check if all lessons are completed
      const allLessonProgress = await Promise.all(
        sortedLessons.map((l) =>
          ctx.db
            .query('lessonProgress')
            .withIndex('by_user_lesson', (q) =>
              q.eq('userId', userId).eq('lessonId', l._id)
            )
            .first()
        )
      );

      const allCompleted = allLessonProgress.every((p) => p?.isCompleted);

      if (allCompleted) {
        // Mark course as completed
        const courseProgress = await ctx.db
          .query('courseProgress')
          .withIndex('by_user_course', (q) =>
            q.eq('userId', userId).eq('courseId', lesson.courseId)
          )
          .first();

        if (courseProgress) {
          await ctx.db.patch(courseProgress._id, {
            isCompleted: true,
          });
        } else {
          await ctx.db.insert('courseProgress', {
            userId,
            courseId: lesson.courseId,
            isUnlocked: true,
            isCompleted: true,
          });
        }

        // Find and unlock next course
        const allCourses = await ctx.db
          .query('courses')
          .withIndex('by_language', (q) => q.eq('language', course.language))
          .collect();

        const sortedCourses = allCourses.sort((a, b) => a.order - b.order);
        const currentCourseIndex = sortedCourses.findIndex(
          (c) => c._id === course._id
        );
        const nextCourse = sortedCourses[currentCourseIndex + 1];

        if (nextCourse) {
          // Unlock next course
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

          // Get first lesson of next course
          const firstLesson = await ctx.db
            .query('lessons')
            .withIndex('by_course_order', (q) =>
              q.eq('courseId', nextCourse._id).eq('order', 1)
            )
            .first();

          if (firstLesson) {
            // Unlock first lesson of next course
            const firstLessonProgress = await ctx.db
              .query('lessonProgress')
              .withIndex('by_user_lesson', (q) =>
                q.eq('userId', userId).eq('lessonId', firstLesson._id)
              )
              .first();

            if (!firstLessonProgress) {
              await ctx.db.insert('lessonProgress', {
                userId,
                lessonId: firstLesson._id,
                isUnlocked: true,
                isCompleted: false,
              });
            }

            // Update current course and lesson
            await ctx.db.patch(userId, {
              currentCourse: nextCourse._id,
              currentLesson: firstLesson._id,
            });
          }
        }
      }
    }

    return { success: true };
  },
});
