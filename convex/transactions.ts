import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createTransaction = mutation({
  args: {
    title: v.string(),
    amount: v.number(),
    type: v.string(),
    userId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }
    try {
      const transactionId = await ctx.db.insert('transactions', args);
      return {
        success: true,
        message: 'Transaction created successfully',
        transactionId,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Failed to create transaction. Please try again.',
      };
    }
  },
});

export const getTransactionsCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const transactionIds = await ctx.db
      .query('transactions')
      .withIndex('by_user_id')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();
    return transactionIds.length;
  },
});

export const getTransactions = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_user_id')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .collect();

    return transactions;
  },
});

export const getTransaction = query({
  args: {
    id: v.id('transactions'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }
    const transaction = await ctx.db.get(args.id);
    if (transaction?.userId !== identity.subject) {
      throw new Error('Not authorized');
    }
    return transaction;
  },
});

export const updateTransaction = mutation({
  args: {
    id: v.id('transactions'),
    title: v.string(),
    amount: v.number(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }

    try {
      const { id, ...updateFields } = args;
      await ctx.db.patch(id, updateFields);
      return {
        success: true,
        message: 'Transaction updated successfully',
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Failed to update transaction. Please try again.',
      };
    }
  },
});

export const deleteTransaction = mutation({
  args: {
    id: v.id('transactions'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Not authenticated');
    }
    try {
      await ctx.db.delete(args.id);
      return {
        success: true,
        message: 'Transaction deleted successfully',
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Failed to delete transaction. Please try again.',
      };
    }
  },
});
