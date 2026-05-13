"use node";

import { v } from "convex/values";
import { internalAction, action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import {
  type Brief,
  type BriefItem,
  buildItemId,
  SCHEMA_VERSION,
} from "@the-pull/schema";
import {
  renderBriefMarkdown,
  renderBriefsRss,
  estimateReadingTimeSeconds,
} from "@the-pull/shared/markdown";
import type { Doc } from "./_generated/dataModel";

const SITE_URL = process.env.SITE_URL ?? "https://thepull.dev";

/** Build a v1 JSON brief from the stored candidates + brief row. */
function buildBriefJson(args: {
  date: string;
  edition: number;
  publishedAtIso: string;
  editorNote?: string;
  items: Doc<"candidates">[];
}): Brief {
  const items: BriefItem[] = args.items.map((c, idx) => {
    const reading =
      c.readingTimeSeconds ??
      estimateReadingTimeSeconds({
        summary: c.summary,
        commentary: c.commentary,
      });
    return {
      id: buildItemId(args.date, idx + 1),
      title: c.title,
      summary: c.summary,
      commentary: c.commentary,
      category: c.category,
      tags: c.tags,
      links: c.links,
      source: c.source,
      importance: c.importance,
      reading_time_seconds: reading,
    };
  });
  return {
    version: SCHEMA_VERSION,
    date: args.date,
    edition: args.edition,
    published_at: args.publishedAtIso,
    editor_note: args.editorNote,
    items,
    stats: {
      item_count: items.length,
      total_reading_time_seconds: items.reduce(
        (a, it) => a + (it.reading_time_seconds ?? 0),
        0,
      ),
    },
  };
}

function renderHtml(brief: Brief): string {
  const itemsHtml = brief.items
    .map(
      (it, i) => `
    <article style="margin: 2rem 0;">
      <h2 style="font-size: 1.25rem; margin: 0 0 .25rem 0;">${i + 1}. ${escapeHtml(it.title)}</h2>
      <p style="color:#7f849c;font-size:.875rem;margin:0 0 .75rem 0;">${escapeHtml(it.category)} · ${escapeHtml(it.importance)}</p>
      ${it.summary ? `<p>${escapeHtml(it.summary)}</p>` : ""}
      ${it.commentary ? `<blockquote style="border-left:3px solid #cba6f7;padding-left:.75rem;color:#a6adc8;">${escapeHtml(it.commentary)}</blockquote>` : ""}
      ${
        it.links
          ? `<ul>${it.links
              .map(
                (l) =>
                  `<li><a href="${escapeAttr(l.url)}">${escapeHtml(l.label)}</a> <em>(${l.type})</em></li>`,
              )
              .join("")}</ul>`
          : ""
      }
    </article>`,
    )
    .join("");
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>The Pull — Edition #${brief.edition}</title></head>
<body style="font-family: ui-sans-serif, system-ui; background:#1e1e2e; color:#cdd6f4; max-width: 720px; margin: 2rem auto; padding: 1rem;">
<header><h1>The Pull — Edition #${brief.edition}</h1><p style="color:#bac2de;">${brief.date}</p>${brief.editor_note ? `<p><em>${escapeHtml(brief.editor_note)}</em></p>` : ""}</header>
${itemsHtml}
<footer style="color:#7f849c;font-size:.85rem;margin-top:3rem;">
  <p>Get this in your terminal: <code>curl -fsSL ${SITE_URL}/install | sh</code></p>
</footer>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&apos;");
}

export const publishBrief = action({
  args: { date: v.string() },
  handler: async (
    ctx,
    { date },
  ): Promise<{ ok: true; edition: number; republished: boolean }> => {
    const brief: Doc<"briefs"> | null = await ctx.runQuery(api.briefs.getByDate, { date });
    if (!brief) throw new Error(`No brief for ${date}`);
    // Re-publishing is supported: we re-render the JSON/MD/HTML/RSS
    // artifacts and bump publishedAt so the latest content goes live. We
    // skip the email dispatch on re-publish — the brief already shipped, and
    // re-sending would spam subscribers when the curator just wants to fix
    // a typo or add an item.
    const isRepublish = brief.status === "published";

    const kept = (await ctx.runQuery(api.candidates.listKept, {
      targetDate: date,
    })) as Doc<"candidates">[];
    if (kept.length === 0) {
      throw new Error(`No 'keep' candidates for ${date}`);
    }

    const publishedAt = new Date();
    const briefJson = buildBriefJson({
      date,
      edition: brief.edition,
      publishedAtIso: publishedAt.toISOString(),
      editorNote: brief.editorNote,
      items: kept,
    });
    const markdown = renderBriefMarkdown(briefJson, { webBaseUrl: SITE_URL });
    const html = renderHtml(briefJson);

    // Build the rolling RSS feed
    const recent = (await ctx.runQuery(api.briefs.listPublished, {
      limit: 30,
    })) as Doc<"briefs">[];
    const recentBriefs: Brief[] = [briefJson];
    for (const b of recent) {
      if (b.date === date) continue;
      if (b.renderedJson) {
        try {
          recentBriefs.push(JSON.parse(b.renderedJson) as Brief);
        } catch {
          /* ignore */
        }
      }
    }
    const rss = renderBriefsRss({
      briefs: recentBriefs,
      feedUrl: `${SITE_URL}/api/v1/feed/public.xml`,
      siteUrl: SITE_URL,
    });

    const keys = {
      jsonR2Key: `briefs/${date}/brief.json`,
      markdownR2Key: `briefs/${date}/brief.md`,
      htmlR2Key: `briefs/${date}/brief.html`,
      rssR2Key: `briefs/${date}/feed.xml`,
    };
    await ctx.runAction(internal.publish.uploadArtifactsToR2, {
      keys,
      json: JSON.stringify(briefJson, null, 2),
      markdown,
      html,
      rss,
    });

    await ctx.runMutation(internal.briefs.markPublished, {
      briefId: brief._id,
      renderedJson: JSON.stringify(briefJson),
      jsonR2Key: keys.jsonR2Key,
      markdownR2Key: keys.markdownR2Key,
      rssR2Key: keys.rssR2Key,
      htmlR2Key: keys.htmlR2Key,
      itemCount: briefJson.items.length,
      totalReadingTimeSeconds: briefJson.stats.total_reading_time_seconds ?? 0,
    });

    // Best-effort email dispatch — never block publish on send failures.
    // Skip on re-publish (see comment at top of handler).
    if (!isRepublish) {
      try {
        await ctx.runAction(internal.email.sendDailyBrief, { briefDate: date });
      } catch (err) {
        console.error("Email dispatch failed", err);
      }
    }

    return { ok: true as const, edition: brief.edition, republished: isRepublish };
  },
});

/**
 * Convex does not bind directly to R2. The web app's worker handles R2 writes
 * via a signed internal HTTP endpoint. This action forwards artifacts to that
 * endpoint using SITE_URL + an internal shared secret (CMS_AUTH_SECRET).
 */
export const uploadArtifactsToR2 = internalAction({
  args: {
    keys: v.object({
      jsonR2Key: v.string(),
      markdownR2Key: v.string(),
      htmlR2Key: v.string(),
      rssR2Key: v.string(),
    }),
    json: v.string(),
    markdown: v.string(),
    html: v.string(),
    rss: v.string(),
  },
  handler: async (_ctx, args) => {
    const secret = process.env.CMS_AUTH_SECRET;
    if (!secret) throw new Error("CMS_AUTH_SECRET not configured");
    const resp = await fetch(`${SITE_URL}/api/internal/publish-artifacts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": secret,
      },
      body: JSON.stringify(args),
    });
    if (!resp.ok) {
      throw new Error(
        `R2 upload failed: ${resp.status} ${await resp.text()}`,
      );
    }
  },
});

/** Cron entry — finds today's scheduled brief in ET and publishes it. */
export const publishScheduledBrief = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ ok: true; edition: number; republished: boolean }> => {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/New_York",
    });
    return await ctx.runAction(api.publish.publishBrief, { date: today });
  },
});
