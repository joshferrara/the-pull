import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const EventType = v.union(
  v.literal("brief_view"),
  v.literal("item_save"),
  v.literal("item_link_click"),
  v.literal("tui_launch"),
  v.literal("api_fetch"),
  v.literal("rss_fetch"),
);

const Channel = v.union(
  v.literal("tui"),
  v.literal("cli"),
  v.literal("api"),
  v.literal("rss"),
  v.literal("email"),
  v.literal("web"),
);

const EventBody = v.object({
  type: EventType,
  briefDate: v.optional(v.string()),
  itemId: v.optional(v.id("candidates")),
  channel: Channel,
  sessionHash: v.optional(v.string()),
  timestamp: v.number(),
});

export const insert = mutation({
  args: EventBody.fields,
  handler: async (ctx, args) => {
    await ctx.db.insert("events", args);
  },
});

export const insertBatch = mutation({
  args: { events: v.array(EventBody) },
  handler: async (ctx, { events }) => {
    for (const e of events) await ctx.db.insert("events", e);
    return { inserted: events.length };
  },
});

export const forDate = query({
  args: { briefDate: v.string() },
  handler: async (ctx, { briefDate }) =>
    await ctx.db
      .query("events")
      .withIndex("by_brief_date", (q) => q.eq("briefDate", briefDate))
      .collect(),
});
