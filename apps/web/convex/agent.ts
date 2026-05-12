"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  RESPONSE_JSON_SCHEMA,
} from "./prompts/v1";
import type { Id } from "./_generated/dataModel";

interface BookmarkRow {
  _id: Id<"bookmarks">;
  url: string;
  sourceAuthor?: string;
  sourceUrl?: string;
  rawContent?: string;
}

const CLAUDE_MODEL = "claude-sonnet-4-6";

interface AgentDraftOutput {
  title: string;
  summary: string;
  category: "model" | "tool" | "protocol" | "research" | "business" | "meta";
  importance: "high" | "medium" | "low";
  tags: string[];
  links: Array<{
    url: string;
    label: string;
    type: "primary" | "reference" | "discussion";
  }>;
  suggested_commentary_angle: string;
}

function nextWeekdayISO(from = new Date()): string {
  const d = new Date(from);
  do {
    d.setUTCDate(d.getUTCDate() + 1);
  } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().slice(0, 10);
}

async function callClaude(
  apiKey: string,
  bookmarks: BookmarkRow[],
): Promise<AgentDraftOutput> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                buildUserPrompt({
                  bookmarks: bookmarks.map((b) => ({
                    url: b.url,
                    sourceAuthor: b.sourceAuthor,
                    rawContent: b.rawContent,
                  })),
                }) +
                "\n\nRespond with JSON matching this schema:\n" +
                JSON.stringify(RESPONSE_JSON_SCHEMA),
            },
          ],
        },
      ],
    }),
  });
  if (!resp.ok) {
    throw new Error(`Claude error ${resp.status}: ${await resp.text()}`);
  }
  const data = (await resp.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = data.content.find((c) => c.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Could not extract JSON from response: ${text}`);
  return JSON.parse(match[0]) as AgentDraftOutput;
}

/** Group bookmarks by canonical hostname-and-slug as a cheap dedup heuristic. */
function groupBookmarks(rows: BookmarkRow[]): BookmarkRow[][] {
  const groups = new Map<string, BookmarkRow[]>();
  for (const row of rows) {
    let key: string;
    try {
      const u = new URL(row.url);
      key = (u.hostname + u.pathname).toLowerCase().replace(/\/$/, "");
    } catch {
      key = row.url;
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return Array.from(groups.values());
}

export const processPending = action({
  args: {
    bookmarkIds: v.optional(v.array(v.id("bookmarks"))),
    targetDate: v.optional(v.string()),
  },
  handler: async (ctx, { bookmarkIds, targetDate }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
    const target = targetDate ?? nextWeekdayISO();

    const all = (await ctx.runQuery(api.bookmarks.listPending)) as BookmarkRow[];
    const selected = bookmarkIds
      ? all.filter((b) => bookmarkIds.includes(b._id))
      : all;
    if (selected.length === 0) return { processed: 0, candidates: 0 };

    const groups = groupBookmarks(selected);
    let candidates = 0;
    for (const group of groups) {
      try {
        const draft = await callClaude(apiKey, group);
        const candidateId = await ctx.runMutation(
          internal.candidates.createDraft,
          {
            targetDate: target,
            title: draft.title,
            summary: draft.summary,
            commentary: draft.suggested_commentary_angle,
            category: draft.category,
            tags: draft.tags,
            links: draft.links,
            source: group[0].sourceUrl
              ? {
                  type: "twitter",
                  url: group[0].sourceUrl,
                  author: group[0].sourceAuthor,
                }
              : undefined,
            importance: draft.importance,
            bookmarkIds: group.map((g) => g._id),
          },
        );
        await ctx.runMutation(internal.bookmarks.setProcessed, {
          bookmarkIds: group.map((g) => g._id),
          candidateId,
        });
        candidates++;
      } catch (err) {
        console.error("Failed to draft candidate for group:", err);
        // Skip on failure; bookmarks stay pending for retry.
      }
    }
    return { processed: selected.length, candidates };
  },
});

export const syncTwitterBookmarks = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<
    | { added: number; skipped: number; reason?: "twitter_not_configured" }
    | { added: number; skipped: number; error: number }
  > => {
    const token = process.env.TWITTER_BEARER_TOKEN;
    const userId = process.env.TWITTER_USER_ID;
    if (!token || !userId) {
      return {
        added: 0,
        skipped: 0,
        reason: "twitter_not_configured" as const,
      };
    }
    const resp = await fetch(
      `https://api.x.com/2/users/${encodeURIComponent(userId)}/bookmarks?max_results=50&tweet.fields=author_id,entities,text,created_at&expansions=author_id&user.fields=username`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!resp.ok) {
      const body = await resp.text();
      console.error("Twitter sync failed", resp.status, body);
      return { added: 0, skipped: 0, error: resp.status };
    }
    const data = (await resp.json()) as {
      data?: Array<{
        id: string;
        text: string;
        author_id: string;
        entities?: { urls?: Array<{ expanded_url: string }> };
      }>;
      includes?: { users?: Array<{ id: string; username: string }> };
    };
    const userMap = new Map(
      (data.includes?.users ?? []).map((u) => [u.id, u.username]),
    );
    const incoming: Array<{
      url: string;
      sourceUrl: string;
      sourceAuthor?: string;
      rawContent: string;
    }> = [];
    for (const tweet of data.data ?? []) {
      const author = userMap.get(tweet.author_id);
      const tweetUrl = author
        ? `https://x.com/${author}/status/${tweet.id}`
        : `https://x.com/i/status/${tweet.id}`;
      const linkedUrls = tweet.entities?.urls?.map((u) => u.expanded_url) ?? [];
      const primary = linkedUrls[0] ?? tweetUrl;
      incoming.push({
        url: primary,
        sourceUrl: tweetUrl,
        sourceAuthor: author ? `@${author}` : undefined,
        rawContent: tweet.text,
      });
    }
    const result: { added: number; skipped: number } = await ctx.runMutation(
      api.bookmarks.bulkInsert,
      {
        sourceType: "twitter" as const,
        bookmarks: incoming,
      },
    );
    return result;
  },
});
