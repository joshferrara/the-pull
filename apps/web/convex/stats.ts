import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

/** Roll up yesterday's events into itemStats + briefStats per date. */
export const rollupForDate = internalMutation({
  args: { briefDate: v.string() },
  handler: async (ctx, { briefDate }) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_brief_date", (q) => q.eq("briefDate", briefDate))
      .collect();

    const perItem = new Map<
      string,
      { saves: number; linkClicks: number; views: number; sessions: Set<string> }
    >();
    const brief = {
      totalViews: 0,
      sessions: new Set<string>(),
      apiFetches: 0,
      rssFetches: 0,
      emailOpens: 0,
      tuiLaunches: 0,
    };

    for (const e of events) {
      if (e.sessionHash) brief.sessions.add(e.sessionHash);
      if (e.type === "brief_view") brief.totalViews++;
      if (e.type === "api_fetch") brief.apiFetches++;
      if (e.type === "rss_fetch") brief.rssFetches++;
      if (e.type === "tui_launch") brief.tuiLaunches++;
      if (!e.itemId) continue;
      const key = e.itemId.toString();
      const slot =
        perItem.get(key) ??
        { saves: 0, linkClicks: 0, views: 0, sessions: new Set<string>() };
      if (e.type === "item_save") slot.saves++;
      else if (e.type === "item_link_click") slot.linkClicks++;
      else if (e.type === "brief_view") slot.views++;
      if (e.sessionHash) slot.sessions.add(e.sessionHash);
      perItem.set(key, slot);
    }

    // Upsert briefStats
    const bs = await ctx.db
      .query("briefStats")
      .withIndex("by_brief_date", (q) => q.eq("briefDate", briefDate))
      .first();
    const briefStatsRow = {
      briefDate,
      totalViews: brief.totalViews,
      uniqueSessions: brief.sessions.size,
      apiFetches: brief.apiFetches,
      rssFetches: brief.rssFetches,
      emailOpens: brief.emailOpens,
      tuiLaunches: brief.tuiLaunches,
    };
    if (bs) await ctx.db.patch(bs._id, briefStatsRow);
    else await ctx.db.insert("briefStats", briefStatsRow);

    // Upsert per-item stats
    for (const [itemKey, slot] of perItem.entries()) {
      const itemId = itemKey as unknown as import("./_generated/dataModel").Id<"candidates">;
      const existing = await ctx.db
        .query("itemStats")
        .withIndex("by_item", (q) => q.eq("itemId", itemId))
        .first();
      const row = {
        itemId,
        briefDate,
        saves: slot.saves,
        linkClicks: slot.linkClicks,
        views: slot.views,
        uniqueSessions: slot.sessions.size,
      };
      if (existing) await ctx.db.patch(existing._id, row);
      else await ctx.db.insert("itemStats", row);
    }

    return { items: perItem.size };
  },
});

export const getBriefStats = query({
  args: { briefDate: v.string() },
  handler: async (ctx, { briefDate }) =>
    await ctx.db
      .query("briefStats")
      .withIndex("by_brief_date", (q) => q.eq("briefDate", briefDate))
      .first(),
});

export const getItemStats = query({
  args: { briefDate: v.string() },
  handler: async (ctx, { briefDate }) =>
    await ctx.db
      .query("itemStats")
      .withIndex("by_brief_date", (q) => q.eq("briefDate", briefDate))
      .collect(),
});
