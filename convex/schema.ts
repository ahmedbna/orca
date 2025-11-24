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
    githubId: v.optional(v.number()),
  })
    .index('email', ['email'])
    .index('phone', ['phone']),

  students: defineTable({
    userId: v.id('users'),
    agentId: v.string(),
    nativeLanguage: v.object({
      name: v.string(),
      code: v.string(),
      flag: v.string(),
      native: v.string(),
    }), // Native language of the user
    learningLanguage: v.object({
      name: v.string(),
      code: v.string(),
      flag: v.string(),
      native: v.string(),
    }), // Language they are learning
    voiceId: v.optional(v.string()),
    currentLessonId: v.optional(v.id('lessons')), // Current lesson progress
    completedLessons: v.optional(v.array(v.id('lessons'))), // Completed lessons
    current: v.optional(v.boolean()),
  })
    .index('by_user', ['userId'])
    .index('by_user_current', ['userId', 'current'])
    .index('by_user_language', ['userId', 'learningLanguage.code']),

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
    language: v.object({
      name: v.string(),
      code: v.string(),
      flag: v.string(),
      native: v.string(),
    }),
    order: v.number(),
    title: v.string(),
    description: v.string(),
    prerequisites: v.optional(v.array(v.id('courses'))),
  })
    .index('by_language', ['language.code'])
    .index('by_language_order', ['language.code', 'order']),

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
  }).index('by_course', ['courseId']),

  progress: defineTable({
    userId: v.id('users'),
    lessonId: v.id('lessons'),
    phrases: v.array(v.string()),
    score: v.float64(),
  })
    .index('by_lesson', ['lessonId'])
    .index('by_user_lesson', ['userId', 'lessonId']),
});
