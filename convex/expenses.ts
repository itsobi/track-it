import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { rateLimiter } from './rateLimiter';

export const createExpense = mutation({
  args: {
    title: v.string(),
    amount: v.number(),
    type: v.string(),
    userId: v.string(),
    order: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    const userId = identity.subject;

    const { ok } = await rateLimiter.limit(ctx, 'createExpense', {
      key: userId,
    });

    if (!ok) {
      return {
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
      };
    }

    try {
      const expenseId = await ctx.db.insert('expenses', args);
      return {
        success: true,
        message: 'Expense created successfully! 💪',
        expenseId,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Failed to create expense. Please try again.',
      };
    }
  },
});

export const getExpenses = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    const data = await ctx.db
      .query('expenses')
      .withIndex('by_user_and_order')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();

    const expensesTotal = data.reduce(
      (acc, expense) => acc + expense.amount,
      0
    );

    return {
      data,
      expensesTotal,
    };
  },
});

export const getExpensesCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    try {
      return await ctx.db
        .query('expenses')
        .filter((q) => q.eq(q.field('userId'), args.userId))
        .collect()
        .then((expenses) => expenses.length);
    } catch (error) {
      console.error('Error fetching expense count:', error);
      throw new Error('Failed to fetch expense count');
    }
  },
});

export const getExpense = query({
  args: { id: v.id('expenses') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }
    return await ctx.db.get(args.id);
  },
});

export const updateExpenseOrder = mutation({
  args: { id: v.id('expenses'), order: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }
    await ctx.db.patch(args.id, { order: args.order });
  },
});

export const updateExpense = mutation({
  args: {
    id: v.id('expenses'),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    const userId = identity.subject;

    const { ok } = await rateLimiter.limit(ctx, 'updateExpense', {
      key: userId,
    });

    if (!ok) {
      return {
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
      };
    }

    // Remove the id from the args before patching
    const { id, ...updateFields } = args;

    try {
      await ctx.db.patch(id, updateFields);

      return {
        success: true,
        message: 'Fixed expense updated successfully! 💪',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update fixed expense.',
      };
    }
  },
});

export const deleteExpense = mutation({
  args: {
    id: v.id('expenses'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    const userId = identity.subject;

    if (userId.split('|')[0] !== args.userId) {
      throw new Error('Not authorized');
    }

    const { ok } = await rateLimiter.limit(ctx, 'deleteExpense', {
      key: userId,
    });

    if (!ok) {
      return {
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
      };
    }

    try {
      await ctx.db.delete(args.id);
      return {
        success: true,
        message: 'Fixed expense deleted successfully!',
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Failed to delete fixed expense.',
      };
    }
  },
});
