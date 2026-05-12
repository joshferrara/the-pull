"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { Brief } from "@the-pull/schema";
import { renderBriefMarkdown } from "@the-pull/shared/markdown";

const SITE_URL = process.env.SITE_URL ?? "https://thepull.dev";
const INTERNAL_PATH = "/api/internal/send-brief-emails";

export const sendDailyBrief = internalAction({
  args: { briefDate: v.string() },
  handler: async (ctx, { briefDate }) => {
    const brief = await ctx.runQuery(api.briefs.getByDate, { date: briefDate });
    if (!brief || brief.status !== "published" || !brief.renderedJson) {
      return { sent: 0, reason: "brief_not_ready" } as const;
    }
    const users: Array<{
      _id: import("./_generated/dataModel").Id<"users">;
      email: string;
    }> = await ctx.runQuery(api.users.activeEmailSubscribers);
    const secret = process.env.CMS_AUTH_SECRET;
    if (!secret) throw new Error("CMS_AUTH_SECRET not configured");

    const parsed = JSON.parse(brief.renderedJson) as Brief;
    const plainText = renderBriefMarkdown(parsed, { webBaseUrl: SITE_URL });

    const resp = await fetch(`${SITE_URL}${INTERNAL_PATH}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": secret,
      },
      body: JSON.stringify({
        briefDate,
        recipients: users.map((u) => ({ id: u._id, email: u.email })),
        plainText,
      }),
    });
    if (!resp.ok) {
      throw new Error(`Send-out failed: ${resp.status}`);
    }
    const data = (await resp.json()) as { sent: number; failed: number };
    return data;
  },
});
