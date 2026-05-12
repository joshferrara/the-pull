import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

const Category = v.union(
  v.literal("model"),
  v.literal("tool"),
  v.literal("protocol"),
  v.literal("research"),
  v.literal("business"),
  v.literal("meta"),
);

const Importance = v.union(
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);

const Decision = v.union(
  v.literal("undecided"),
  v.literal("keep"),
  v.literal("kill"),
);

const LinkObj = v.object({
  url: v.string(),
  label: v.string(),
  type: v.union(
    v.literal("primary"),
    v.literal("reference"),
    v.literal("discussion"),
  ),
});

const SourceObj = v.object({
  type: v.string(),
  url: v.string(),
  author: v.optional(v.string()),
});

export const createDraft = internalMutation({
  args: {
    targetDate: v.string(),
    title: v.string(),
    summary: v.string(),
    commentary: v.optional(v.string()),
    category: Category,
    tags: v.array(v.string()),
    links: v.array(LinkObj),
    source: v.optional(SourceObj),
    importance: Importance,
    bookmarkIds: v.array(v.id("bookmarks")),
    readingTimeSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("candidates", {
      ...args,
      decision: "undecided",
    });
  },
});

export const listByDate = query({
  args: { targetDate: v.string() },
  handler: async (ctx, { targetDate }) => {
    return await ctx.db
      .query("candidates")
      .withIndex("by_target_date", (q) => q.eq("targetDate", targetDate))
      .collect();
  },
});

export const listKept = query({
  args: { targetDate: v.string() },
  handler: async (ctx, { targetDate }) => {
    const rows = await ctx.db
      .query("candidates")
      .withIndex("by_target_date_decision", (q) =>
        q.eq("targetDate", targetDate).eq("decision", "keep"),
      )
      .collect();
    return rows.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  },
});

export const getById = query({
  args: { candidateId: v.id("candidates") },
  handler: async (ctx, { candidateId }) => ctx.db.get(candidateId),
});

export const setDecision = mutation({
  args: {
    candidateId: v.id("candidates"),
    decision: Decision,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId, { decision: args.decision });
  },
});

export const updateFields = mutation({
  args: {
    candidateId: v.id("candidates"),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    commentary: v.optional(v.string()),
    category: v.optional(Category),
    tags: v.optional(v.array(v.string())),
    links: v.optional(v.array(LinkObj)),
    importance: v.optional(Importance),
    readingTimeSeconds: v.optional(v.number()),
    position: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { candidateId, ...rest } = args;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(candidateId, patch);
  },
});

export const reorderKept = mutation({
  args: {
    targetDate: v.string(),
    orderedIds: v.array(v.id("candidates")),
  },
  handler: async (ctx, { orderedIds }) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i], { position: i + 1 });
    }
  },
});

export const manualAdd = mutation({
  args: {
    targetDate: v.string(),
    title: v.string(),
    summary: v.string(),
    category: Category,
    importance: Importance,
    links: v.array(LinkObj),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("candidates", {
      targetDate: args.targetDate,
      title: args.title,
      summary: args.summary,
      category: args.category,
      tags: [],
      links: args.links,
      importance: args.importance,
      decision: "undecided",
      bookmarkIds: [],
    });
  },
});
