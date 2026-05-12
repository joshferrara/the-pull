"use node";

import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const nightlyPipeline = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number; candidates: number }> => {
    await ctx.runAction(api.agent.syncTwitterBookmarks);
    return await ctx.runAction(api.agent.processPending, {});
  },
});

export const dailyRollup = internalAction({
  args: {},
  handler: async (ctx): Promise<{ items: number }> => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    return await ctx.runMutation(internal.stats.rollupForDate, {
      briefDate: yesterday,
    });
  },
});
