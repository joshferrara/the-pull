import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  bookmarks: defineTable({
    url: v.string(),
    sourceType: v.union(
      v.literal("twitter"),
      v.literal("manual"),
      v.literal("rss"),
      v.literal("share_sheet"),
    ),
    sourceUrl: v.optional(v.string()),
    sourceAuthor: v.optional(v.string()),
    capturedAt: v.number(),
    capturedDate: v.string(),
    rawContent: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processed"),
      v.literal("ignored"),
    ),
    candidateId: v.optional(v.id("candidates")),
  })
    .index("by_status", ["status"])
    .index("by_captured_date", ["capturedDate"])
    .index("by_url", ["url"]),

  candidates: defineTable({
    targetDate: v.string(),
    title: v.string(),
    summary: v.string(),
    commentary: v.optional(v.string()),
    category: v.union(
      v.literal("model"),
      v.literal("tool"),
      v.literal("protocol"),
      v.literal("research"),
      v.literal("business"),
      v.literal("meta"),
    ),
    tags: v.array(v.string()),
    links: v.array(
      v.object({
        url: v.string(),
        label: v.string(),
        type: v.union(
          v.literal("primary"),
          v.literal("reference"),
          v.literal("discussion"),
        ),
      }),
    ),
    source: v.optional(
      v.object({
        type: v.string(),
        url: v.string(),
        author: v.optional(v.string()),
      }),
    ),
    importance: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    ),
    decision: v.union(
      v.literal("undecided"),
      v.literal("keep"),
      v.literal("kill"),
    ),
    position: v.optional(v.number()),
    bookmarkIds: v.array(v.id("bookmarks")),
    readingTimeSeconds: v.optional(v.number()),
  })
    .index("by_target_date", ["targetDate"])
    .index("by_target_date_decision", ["targetDate", "decision"]),

  briefs: defineTable({
    date: v.string(),
    edition: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("published"),
    ),
    editorNote: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    scheduledFor: v.optional(v.number()),
    itemIds: v.array(v.id("candidates")),
    renderedJson: v.optional(v.string()),
    jsonR2Key: v.optional(v.string()),
    markdownR2Key: v.optional(v.string()),
    rssR2Key: v.optional(v.string()),
    htmlR2Key: v.optional(v.string()),
    itemCount: v.optional(v.number()),
    totalReadingTimeSeconds: v.optional(v.number()),
  })
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_edition", ["edition"]),

  users: defineTable({
    email: v.string(),
    emailVerified: v.boolean(),
    createdAt: v.number(),
    source: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("unsubscribed"),
      v.literal("bounced"),
    ),
    timezone: v.optional(v.string()),
    preferences: v.object({
      emailEnabled: v.boolean(),
      analyticsOptOut: v.boolean(),
    }),
  }).index("by_email", ["email"]),

  authCodes: defineTable({
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
    purpose: v.union(
      v.literal("signup"),
      v.literal("login"),
      v.literal("dashboard_reauth"),
    ),
  })
    .index("by_code", ["code"])
    .index("by_email", ["email"]),

  tokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    scope: v.union(v.literal("api"), v.literal("rss"), v.literal("cli")),
    label: v.optional(v.string()),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  events: defineTable({
    type: v.union(
      v.literal("brief_view"),
      v.literal("item_save"),
      v.literal("item_link_click"),
      v.literal("tui_launch"),
      v.literal("api_fetch"),
      v.literal("rss_fetch"),
    ),
    briefDate: v.optional(v.string()),
    itemId: v.optional(v.id("candidates")),
    channel: v.union(
      v.literal("tui"),
      v.literal("cli"),
      v.literal("api"),
      v.literal("rss"),
      v.literal("email"),
      v.literal("web"),
    ),
    sessionHash: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_brief_date", ["briefDate"])
    .index("by_item", ["itemId"])
    .index("by_type_date", ["type", "briefDate"])
    .index("by_session_date", ["sessionHash", "briefDate"]),

  itemStats: defineTable({
    itemId: v.id("candidates"),
    briefDate: v.string(),
    saves: v.number(),
    linkClicks: v.number(),
    views: v.number(),
    uniqueSessions: v.number(),
  })
    .index("by_brief_date", ["briefDate"])
    .index("by_item", ["itemId"]),

  briefStats: defineTable({
    briefDate: v.string(),
    totalViews: v.number(),
    uniqueSessions: v.number(),
    apiFetches: v.number(),
    rssFetches: v.number(),
    emailOpens: v.number(),
    tuiLaunches: v.number(),
  }).index("by_brief_date", ["briefDate"]),

  rateLimits: defineTable({
    tokenHash: v.string(),
    date: v.string(),
    requestCount: v.number(),
  }).index("by_token_date", ["tokenHash", "date"]),
});
