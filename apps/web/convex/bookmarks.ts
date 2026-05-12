import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

const SourceType = v.union(
  v.literal("twitter"),
  v.literal("manual"),
  v.literal("rss"),
  v.literal("share_sheet"),
);

function isoDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/** Insert a bookmark. Skips if URL already exists (returns existing id). */
export const insert = mutation({
  args: {
    url: v.string(),
    sourceType: SourceType,
    sourceUrl: v.optional(v.string()),
    sourceAuthor: v.optional(v.string()),
    rawContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const url = args.url.trim();
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_url", (q) => q.eq("url", url))
      .first();
    if (existing) return { id: existing._id, inserted: false };
    const now = Date.now();
    const id = await ctx.db.insert("bookmarks", {
      url,
      sourceType: args.sourceType,
      sourceUrl: args.sourceUrl,
      sourceAuthor: args.sourceAuthor,
      capturedAt: now,
      capturedDate: isoDate(now),
      rawContent: args.rawContent,
      status: "pending",
    });
    return { id, inserted: true };
  },
});

export const bulkInsert = mutation({
  args: {
    sourceType: SourceType,
    bookmarks: v.array(
      v.object({
        url: v.string(),
        sourceUrl: v.optional(v.string()),
        sourceAuthor: v.optional(v.string()),
        rawContent: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let added = 0;
    let skipped = 0;
    const now = Date.now();
    const today = isoDate(now);
    for (const b of args.bookmarks) {
      const url = b.url.trim();
      const existing = await ctx.db
        .query("bookmarks")
        .withIndex("by_url", (q) => q.eq("url", url))
        .first();
      if (existing) {
        skipped++;
        continue;
      }
      await ctx.db.insert("bookmarks", {
        url,
        sourceType: args.sourceType,
        sourceUrl: b.sourceUrl,
        sourceAuthor: b.sourceAuthor,
        capturedAt: now,
        capturedDate: today,
        rawContent: b.rawContent,
        status: "pending",
      });
      added++;
    }
    return { added, skipped };
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) =>
    await ctx.db
      .query("bookmarks")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect(),
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query("bookmarks")
      .order("desc")
      .take(limit ?? 100);
  },
});

export const setProcessed = internalMutation({
  args: {
    bookmarkIds: v.array(v.id("bookmarks")),
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, { bookmarkIds, candidateId }) => {
    for (const id of bookmarkIds) {
      await ctx.db.patch(id, { status: "processed", candidateId });
    }
  },
});

export const ignore = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, { bookmarkId }) => {
    await ctx.db.patch(bookmarkId, { status: "ignored" });
  },
});
