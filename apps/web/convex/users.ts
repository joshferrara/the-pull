import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsertVerified = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        emailVerified: true,
        ...(args.timezone && existing.timezone !== args.timezone
          ? { timezone: args.timezone }
          : {}),
      });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      email,
      emailVerified: true,
      createdAt: Date.now(),
      source: args.source,
      status: "active",
      timezone: args.timezone,
      preferences: { emailEnabled: true, analyticsOptOut: false },
    });
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => ctx.db.get(userId),
});

export const setEmailEnabled = mutation({
  args: { userId: v.id("users"), enabled: v.boolean() },
  handler: async (ctx, { userId, enabled }) => {
    const u = await ctx.db.get(userId);
    if (!u) throw new Error("user not found");
    await ctx.db.patch(userId, {
      preferences: { ...u.preferences, emailEnabled: enabled },
    });
  },
});

export const setAnalyticsOptOut = mutation({
  args: { userId: v.id("users"), optOut: v.boolean() },
  handler: async (ctx, { userId, optOut }) => {
    const u = await ctx.db.get(userId);
    if (!u) throw new Error("user not found");
    await ctx.db.patch(userId, {
      preferences: { ...u.preferences, analyticsOptOut: optOut },
    });
  },
});

export const setTimezone = mutation({
  args: { userId: v.id("users"), timezone: v.string() },
  handler: async (ctx, { userId, timezone }) => {
    await ctx.db.patch(userId, { timezone });
  },
});

export const unsubscribe = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { status: "unsubscribed" });
    const tokens = await ctx.db
      .query("tokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const now = Date.now();
    for (const t of tokens) {
      if (!t.revokedAt) await ctx.db.patch(t._id, { revokedAt: now });
    }
  },
});

export const markBounced = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const u = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email.trim().toLowerCase()))
      .first();
    if (u) await ctx.db.patch(u._id, { status: "bounced" });
  },
});

export const activeEmailSubscribers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("preferences.emailEnabled"), true),
        ),
      )
      .collect();
  },
});
