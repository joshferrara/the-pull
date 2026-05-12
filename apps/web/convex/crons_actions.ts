"use node";

import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { emailProviderPayload } from "./shared/email_payload";

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

/**
 * Weekly metrics summary for the curator — spec 5.13 `weeklyReport`.
 * Aggregates the last 7 days of `briefStats` and emails Josh a digest.
 */
export const weeklyReport = internalAction({
  args: {},
  handler: async (ctx): Promise<{ delivered: boolean }> => {
    const cmsEmail = process.env.CMS_EMAIL;
    const secret = process.env.CMS_AUTH_SECRET;
    const site = process.env.SITE_URL;
    if (!cmsEmail || !secret || !site) {
      return { delivered: false };
    }
    // Pull the last 7 weekday briefStats rows.
    const today = new Date();
    const rows: Array<{
      date: string;
      views: number;
      sessions: number;
      api: number;
      rss: number;
      email: number;
      tui: number;
    }> = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
        .toLocaleDateString("en-CA", { timeZone: "America/New_York" });
      const s = await ctx.runQuery(api.stats.getBriefStats, { briefDate: d });
      if (s) {
        rows.push({
          date: d,
          views: s.totalViews,
          sessions: s.uniqueSessions,
          api: s.apiFetches,
          rss: s.rssFetches,
          email: s.emailOpens,
          tui: s.tuiLaunches,
        });
      }
    }
    const totalViews = rows.reduce((a, r) => a + r.views, 0);
    const totalSessions = rows.reduce((a, r) => a + r.sessions, 0);
    const html = [
      `<h2>The Pull — Weekly Report</h2>`,
      `<p>Last 7 days at a glance: <strong>${totalViews} views</strong>, <strong>${totalSessions} unique sessions</strong>.</p>`,
      `<table cellpadding="4" cellspacing="0" border="1"><thead><tr><th>Date</th><th>Views</th><th>Sessions</th><th>API</th><th>RSS</th><th>Email</th><th>TUI</th></tr></thead><tbody>`,
      ...rows.map(
        (r) =>
          `<tr><td>${r.date}</td><td>${r.views}</td><td>${r.sessions}</td><td>${r.api}</td><td>${r.rss}</td><td>${r.email}</td><td>${r.tui}</td></tr>`,
      ),
      `</tbody></table>`,
      `<p><a href="${site}/cms/analytics">Open full analytics</a></p>`,
    ].join("\n");
    const text = `The Pull — Weekly Report\n\n${totalViews} views, ${totalSessions} unique sessions.\n\n${rows
      .map(
        (r) =>
          `${r.date}: views=${r.views} sessions=${r.sessions} api=${r.api} rss=${r.rss} email=${r.email} tui=${r.tui}`,
      )
      .join("\n")}\n\n${site}/cms/analytics`;
    const payload = emailProviderPayload({
      to: cmsEmail,
      subject: "The Pull — Weekly Report",
      html,
      text,
    });
    const resp = await fetch(`${site}/api/internal/send-one-email`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-secret": secret },
      body: JSON.stringify(payload),
    });
    return { delivered: resp.ok };
  },
});
