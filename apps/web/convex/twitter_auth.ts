import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Replace-or-insert the curator's stored X OAuth 2.0 tokens. */
export const set = mutation({
  args: {
    curatorEmail: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    scope: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.curatorEmail.trim().toLowerCase();
    const existing = await ctx.db
      .query("twitterAuth")
      .withIndex("by_curator", (q) => q.eq("curatorEmail", email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
        userId: args.userId,
      });
      return existing._id;
    }
    return await ctx.db.insert("twitterAuth", { ...args, curatorEmail: email });
  },
});

export const get = query({
  args: { curatorEmail: v.string() },
  handler: async (ctx, { curatorEmail }) => {
    return await ctx.db
      .query("twitterAuth")
      .withIndex("by_curator", (q) =>
        q.eq("curatorEmail", curatorEmail.trim().toLowerCase()),
      )
      .first();
  },
});

export const clear = mutation({
  args: { curatorEmail: v.string() },
  handler: async (ctx, { curatorEmail }) => {
    const row = await ctx.db
      .query("twitterAuth")
      .withIndex("by_curator", (q) =>
        q.eq("curatorEmail", curatorEmail.trim().toLowerCase()),
      )
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});
