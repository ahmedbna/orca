import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const get = query({
  args: {
    languageCode: v.string(), // Learning language ID
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const student = await ctx.db
      .query('students')
      .withIndex('by_user_language', (q) =>
        q.eq('userId', authId).eq('learningLanguage.code', args.languageCode)
      )
      .first();

    if (!student) {
      throw new Error('Not found');
    }
    ``;

    return student;
  },
});

export const getCurrent = query({
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const student = await ctx.db
      .query('students')
      .withIndex('by_user_current', (q) =>
        q.eq('userId', authId).eq('current', true)
      )
      .first();

    if (!student) {
      throw new Error('No current');
    }

    return student;
  },
});

export const getAll = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const students = await ctx.db
      .query('students')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    if (!students) {
      throw new Error('No students found');
    }

    return students;
  },
});

export const create = mutation({
  args: {
    agentId: v.string(),
    nativeLanguage: v.object({
      name: v.string(),
      code: v.string(),
      flag: v.string(),
      native: v.string(),
    }),
    learningLanguage: v.object({
      name: v.string(),
      code: v.string(),
      flag: v.string(),
      native: v.string(),
    }),
    voiceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const student = await ctx.db
      .query('students')
      .withIndex('by_user_current', (q) =>
        q.eq('userId', userId).eq('current', true)
      )
      .collect();

    await Promise.all(
      student.map(async (student) => {
        await ctx.db.patch(student._id, {
          current: false,
        });
      })
    );

    const studentId = await ctx.db.insert('students', {
      userId,
      ...args,
      current: true,
    });

    return studentId;
  },
});

export const update = mutation({
  args: {
    studentId: v.id('students'),
    voiceId: v.optional(v.string()),
    nativeLanguage: v.object({
      name: v.string(),
      code: v.string(),
      flag: v.string(),
      native: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const studentId = await ctx.db.patch(args.studentId, {
      nativeLanguage: args.nativeLanguage,
      voiceId: args.voiceId,
    });

    return studentId;
  },
});

export const updateCurrent = mutation({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const student = await ctx.db
      .query('students')
      .withIndex('by_user_current', (q) =>
        q.eq('userId', userId).eq('current', true)
      )
      .collect();

    await Promise.all(
      student.map(async (student) => {
        await ctx.db.patch(student._id, {
          current: false,
        });
      })
    );

    const studentId = await ctx.db.patch(args.studentId, {
      current: true,
    });

    return studentId;
  },
});
