import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const upsertDraft = mutation({
  args: {
    date: v.string(),
    editorNote: v.optional(v.string()),
    itemIds: v.array(v.id("candidates")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("briefs")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        editorNote: args.editorNote,
        itemIds: args.itemIds,
      });
      return existing._id;
    }
    const lastEdition = await ctx.db.query("briefs").order("desc").first();
    const edition = (lastEdition?.edition ?? 0) + 1;
    return await ctx.db.insert("briefs", {
      date: args.date,
      edition,
      status: "draft",
      editorNote: args.editorNote,
      itemIds: args.itemIds,
    });
  },
});

export const schedule = mutation({
  args: {
    briefId: v.id("briefs"),
    scheduledFor: v.number(),
  },
  handler: async (ctx, { briefId, scheduledFor }) => {
    await ctx.db.patch(briefId, { status: "scheduled", scheduledFor });
  },
});

export const markPublished = internalMutation({
  args: {
    briefId: v.id("briefs"),
    renderedJson: v.string(),
    jsonR2Key: v.string(),
    markdownR2Key: v.string(),
    rssR2Key: v.string(),
    htmlR2Key: v.string(),
    itemCount: v.number(),
    totalReadingTimeSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.briefId, {
      status: "published",
      publishedAt: Date.now(),
      renderedJson: args.renderedJson,
      jsonR2Key: args.jsonR2Key,
      markdownR2Key: args.markdownR2Key,
      rssR2Key: args.rssR2Key,
      htmlR2Key: args.htmlR2Key,
      itemCount: args.itemCount,
      totalReadingTimeSeconds: args.totalReadingTimeSeconds,
    });
  },
});

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    return await ctx.db
      .query("briefs")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();
  },
});

export const getLatestPublished = query({
  args: {},
  handler: async (ctx) => {
    // Sort by publishedAt desc so the most-recently-published brief wins,
    // not the most-recently-created row. Re-publishing an existing brief
    // bumps publishedAt, so this picks up curator updates.
    const rows = await ctx.db
      .query("briefs")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    rows.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
    return rows[0] ?? null;
  },
});

export const listPublished = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query("briefs")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .take(limit ?? 30);
  },
});

export const getScheduledForPublish = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    return await ctx.db
      .query("briefs")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();
  },
});
