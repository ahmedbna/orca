import { getAuthUserId } from '@convex-dev/auth/server';
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

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

    // Sort lessons by order
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

        // Determine lesson status
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
          score: lessonProgress?.score || 0,
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

    // Sort by order
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
          totalScore: progress?.totalScore || 0,
        };
      })
    );

    return coursesWithProgress;
  },
});

// Complete a lesson and update progress
export const completeLesson = mutation({
  args: {
    lessonId: v.id('lessons'),
    score: v.float64(),
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

    const isPassing = args.score >= 70;
    const newScore = lessonProgress?.score
      ? Math.max(lessonProgress.score, args.score)
      : args.score;

    if (lessonProgress) {
      await ctx.db.patch(lessonProgress._id, {
        isCompleted: isPassing || lessonProgress.isCompleted,
        score: newScore,
      });
    } else {
      await ctx.db.insert('lessonProgress', {
        userId,
        lessonId: args.lessonId,
        isUnlocked: true,
        isCompleted: isPassing,
        score: args.score,
      });
    }

    // If passing score, unlock next lesson
    if (isPassing) {
      const allLessons = await ctx.db
        .query('lessons')
        .withIndex('by_course', (q) => q.eq('courseId', lesson.courseId))
        .collect();

      const sortedLessons = allLessons.sort((a, b) => a.order - b.order);
      const currentIndex = sortedLessons.findIndex((l) => l._id === lesson._id);
      const nextLesson = sortedLessons[currentIndex + 1];

      if (nextLesson) {
        // Unlock next lesson
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
        }

        // Update current lesson pointer
        await ctx.db.patch(userId, {
          currentLesson: nextLesson._id,
        });
      } else {
        // No more lessons - check if course is complete
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
          // Calculate average score
          const avgScore =
            allLessonProgress.reduce((sum, p) => sum + (p?.score || 0), 0) /
            allLessonProgress.length;

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
              totalScore: avgScore,
            });
          } else {
            await ctx.db.insert('courseProgress', {
              userId,
              courseId: lesson.courseId,
              isUnlocked: true,
              isCompleted: true,
              totalScore: avgScore,
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
              await ctx.db.insert('lessonProgress', {
                userId,
                lessonId: firstLesson._id,
                isUnlocked: true,
                isCompleted: false,
              });

              // Update current course and lesson
              await ctx.db.patch(userId, {
                currentCourse: nextCourse._id,
                currentLesson: firstLesson._id,
              });
            }
          }
        }
      }
    }

    return { success: true };
  },
});

// Initialize user progress (call when user selects a language and starts learning)
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

    // Only initialize if user has selected a language
    if (!user.learningLanguage) {
      throw new Error('Please select a learning language first');
    }

    // Find first course for the selected language
    const firstCourse = await ctx.db
      .query('courses')
      .withIndex('by_language_order', (q) =>
        q.eq('language', user.learningLanguage!).eq('order', 1)
      )
      .first();

    if (!firstCourse) {
      throw new Error('No courses available for this language');
    }

    // Check if already initialized
    const existingCourseProgress = await ctx.db
      .query('courseProgress')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', userId).eq('courseId', firstCourse._id)
      )
      .first();

    if (existingCourseProgress) {
      return { success: true, message: 'Already initialized' };
    }

    // Create course progress for first course
    await ctx.db.insert('courseProgress', {
      userId,
      courseId: firstCourse._id,
      isUnlocked: true,
      isCompleted: false,
    });

    // Get first lesson of first course
    const firstLesson = await ctx.db
      .query('lessons')
      .withIndex('by_course_order', (q) =>
        q.eq('courseId', firstCourse._id).eq('order', 1)
      )
      .first();

    if (!firstLesson) {
      throw new Error('No lessons found for this course');
    }

    // Create lesson progress for first lesson
    await ctx.db.insert('lessonProgress', {
      userId,
      lessonId: firstLesson._id,
      isUnlocked: true,
      isCompleted: false,
    });

    // Set current course and lesson
    await ctx.db.patch(userId, {
      currentCourse: firstCourse._id,
      currentLesson: firstLesson._id,
    });

    return { success: true, message: 'Progress initialized' };
  },
});
