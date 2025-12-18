import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    gender: v.optional(v.string()),
    birthday: v.optional(v.number()),
    image: v.optional(v.union(v.string(), v.null())),
    emailVerificationTime: v.optional(v.float64()),
    phoneVerificationTime: v.optional(v.float64()),
    isAnonymous: v.optional(v.boolean()),

    nativeLanguage: v.optional(v.string()),
    learningLanguage: v.optional(v.string()),
    currentCourse: v.optional(v.id('courses')), // Current active course (highest unlocked)
    currentLesson: v.optional(v.id('lessons')), // Current active lesson (highest unlocked)
    voiceId: v.optional(v.string()),
    agentId: v.optional(v.string()),
  })
    .index('email', ['email'])
    .index('phone', ['phone']),

  credits: defineTable({
    userId: v.id('users'),
    balance: v.number(),
  }).index('by_user', ['userId']),

  conversations: defineTable({
    userId: v.id('users'),
    studentId: v.id('students'),
    lessonId: v.id('lessons'),
    agentId: v.string(),
    conversationId: v.string(),
    duration: v.number(),
    cost: v.number(),
    status: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_user_lesson', ['userId', 'lessonId']),

  courses: defineTable({
    language: v.string(),
    order: v.number(),
    title: v.string(),
    description: v.string(),
    prerequisites: v.optional(v.array(v.id('courses'))),
  })
    .index('by_language', ['language'])
    .index('by_language_order', ['language', 'order']),

  lessons: defineTable({
    courseId: v.id('courses'),
    order: v.number(),
    title: v.string(),
    phrases: v.array(
      v.object({
        order: v.number(),
        text: v.string(),
        dictionary: v.optional(
          v.array(
            v.object({
              language: v.string(),
              translation: v.string(),
            })
          )
        ),
        audioUrl: v.optional(v.string()),
      })
    ),
  })
    .index('by_course', ['courseId'])
    .index('by_course_order', ['courseId', 'order']),

  // Track lesson progress and completion
  lessonProgress: defineTable({
    userId: v.id('users'),
    lessonId: v.id('lessons'),
    isUnlocked: v.boolean(),
    isCompleted: v.boolean(),
    score: v.optional(v.float64()), // Score as percentage (0-100)
  })
    .index('by_user', ['userId'])
    .index('by_user_lesson', ['userId', 'lessonId']),

  // Track course progress and completion
  courseProgress: defineTable({
    userId: v.id('users'),
    courseId: v.id('courses'),
    isUnlocked: v.boolean(),
    isCompleted: v.boolean(),
    totalScore: v.optional(v.float64()), // Average of all lesson scores
  })
    .index('by_user', ['userId'])
    .index('by_user_course', ['userId', 'courseId']),
});
