# The Pull — Implementation Specification

A daily AI news brief for developers, delivered via terminal TUI, JSON API for agents, RSS, email, and web. Built for builders who are too busy to keep up with the daily news.

---

## 1. Product Overview

### 1.1 What It Is

The Pull is a curated daily news brief covering AI tools, models, protocols, research, and developer-relevant business news. Each weekday edition contains 5–10 hand-curated items with objective summaries and editorial commentary explaining why each item matters to builders.

### 1.2 Core Differentiation

- **Multi-channel delivery from a single curated source.** TUI, CLI, JSON API, RSS, email, and web — all generated from one markdown source per day.
- **Agent-native.** A versioned JSON API lets local and remote AI agents poll the brief programmatically with bearer-token auth.
- **Developer-aesthetic CLI.** Beautiful Bubble Tea TUI with Catppuccin Mocha theming. `pull` is part of the morning routine.
- **Editorial voice as the moat.** Agent-drafted summaries plus human-written commentary on every item.

### 1.3 Brand

- **Product name:** The Pull
- **CLI binary:** `pull`
- **Primary domain:** `thepull.dev`
- **Tagline:** "The daily AI brief, delivered where you actually work."
- **Audience:** Developers, engineers, technical founders who build with AI and want a 4-minute morning read.
- **Curator byline:** "by Josh Ferrara" (in masthead, not in URL/branding)

### 1.4 Editorial Cadence

- **Weekday only** (Monday–Friday)
- **Publish time:** 6:00 AM ET (5:00 AM Central)
- **Curation happens the night before** (9–11 PM Central typical)
- **Skip days are explicit:** weekends off, holidays announced in advance
- **Backup curator** identified before launch for vacation/illness coverage

### 1.5 Content Philosophy

- **7 items target, 10 max.** Scarcity is the product. Force cuts.
- **Builder-focused, not headline-focused.** Skip "OpenAI raises $X." Focus on tools, API changes, prompt patterns, libraries — things that change what readers do tomorrow.
- **Two-part item structure:** objective `summary` (what happened, neutral, what agents extract) + subjective `commentary` (why it matters, the voice, the moat).
- **Editor's note at the top** of every edition. Two or three sentences identifying the day's narrative. Written first, before finalizing items.

---

## 2. Architecture Overview

### 2.1 Stack Summary

| Layer                                              | Technology                                                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------ |
| Web app + API + CMS                                | Next.js (latest stable) deployed to Cloudflare Workers via OpenNext adapter                               |
| Database (CMS state)                               | Convex                                                                                                    |
| Object storage (published briefs, install scripts) | Cloudflare R2                                                                                             |
| Key-value (tokens, rate limits)                    | Cloudflare Workers KV                                                                                     |
| Email sending                                      | Cloudflare Email Service (with Resend as abstracted fallback)                                             |
| Cron jobs                                          | Cloudflare Cron Triggers                                                                                  |
| CLI/TUI                                            | Go with Cobra (commands), Bubble Tea (TUI), Lip Gloss (styling), Glamour (markdown), Bubbles (components) |
| CLI distribution                                   | GoReleaser → Homebrew tap, Scoop bucket, `curl                                                            | sh` install script |
| Monorepo tooling                                   | Turborepo with pnpm workspaces                                                                            |

### 2.2 Repository Layout

```
the-pull/
├── apps/
│   ├── web/                          # Next.js app (CMS, marketing, API, web brief)
│   │   ├── app/
│   │   │   ├── (marketing)/
│   │   │   │   ├── page.tsx          # Landing page
│   │   │   │   └── layout.tsx
│   │   │   ├── (cms)/
│   │   │   │   ├── cms/
│   │   │   │   │   ├── page.tsx      # Today's drafts list
│   │   │   │   │   ├── archive/
│   │   │   │   │   ├── settings/
│   │   │   │   │   └── analytics/
│   │   │   │   └── layout.tsx
│   │   │   ├── brief/
│   │   │   │   └── [date]/
│   │   │   │       └── page.tsx      # Public web brief view
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # User token management
│   │   │   ├── api/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── today/route.ts
│   │   │   │   │   ├── briefs/[date]/route.ts
│   │   │   │   │   ├── latest/route.ts
│   │   │   │   │   ├── feed/[token]/route.ts
│   │   │   │   │   ├── events/route.ts
│   │   │   │   │   └── auth/
│   │   │   │   │       ├── register/route.ts
│   │   │   │   │       ├── verify/route.ts
│   │   │   │   │       └── tokens/route.ts
│   │   │   │   └── install/route.ts  # serves install.sh
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── convex.ts
│   │   │   ├── auth.ts
│   │   │   ├── email.ts              # Cloudflare Email + Resend abstraction
│   │   │   ├── tokens.ts
│   │   │   ├── render.ts             # markdown -> JSON/HTML/RSS
│   │   │   └── analytics.ts
│   │   ├── convex/
│   │   │   ├── schema.ts
│   │   │   ├── bookmarks.ts
│   │   │   ├── candidates.ts
│   │   │   ├── briefs.ts
│   │   │   ├── users.ts
│   │   │   ├── tokens.ts
│   │   │   ├── events.ts
│   │   │   ├── stats.ts
│   │   │   ├── auth.ts
│   │   │   ├── crons.ts
│   │   │   └── _generated/
│   │   ├── public/
│   │   ├── wrangler.jsonc
│   │   ├── open-next.config.ts
│   │   ├── next.config.mjs
│   │   └── package.json
│   └── cli/                          # Go CLI
│       ├── cmd/
│       │   ├── root.go
│       │   ├── login.go
│       │   ├── logout.go
│       │   ├── print.go
│       │   ├── tui.go
│       │   ├── search.go
│       │   ├── config.go
│       │   ├── version.go
│       │   └── whoami.go
│       ├── internal/
│       │   ├── api/                  # HTTP client
│       │   ├── auth/                 # token storage (OS keychain)
│       │   ├── cache/                # local brief cache
│       │   ├── config/
│       │   ├── render/               # text/markdown formatting
│       │   ├── store/                # local SQLite for bookmarks/read state
│       │   └── tui/                  # Bubble Tea models
│       │       ├── app.go
│       │       ├── list.go
│       │       ├── detail.go
│       │       ├── saved.go
│       │       ├── help.go
│       │       └── theme.go
│       ├── main.go
│       ├── .goreleaser.yml
│       └── go.mod
├── packages/
│   ├── schema/                       # Shared JSON schema definitions
│   │   ├── v1.json                   # JSON Schema spec
│   │   ├── types.ts                  # TypeScript types
│   │   └── package.json
│   └── shared/
│       ├── markdown/                 # Markdown rendering utilities (TS)
│       └── package.json
├── tap/                              # Homebrew tap (separate repo in practice)
├── scoop/                            # Scoop bucket (separate repo in practice)
├── .github/
│   └── workflows/
│       ├── web-deploy.yml
│       ├── cli-release.yml
│       └── ci.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

Note: The `tap/` and `scoop/` directories are conceptually part of the project but in practice live in separate repos (`josh-ferrara/homebrew-tap` and `josh-ferrara/scoop-bucket`) because Homebrew and Scoop expect dedicated repositories. GoReleaser pushes to them automatically.

### 2.3 Data Flow

**Curation flow:**

1. Throughout the day, Josh bookmarks tweets/links. These are captured into Convex `bookmarks` table via (a) Twitter/X API polling or manual CMS sync, (b) iOS share sheet → API endpoint, (c) manual paste in CMS.
2. Nightly at 9 PM Central, Cloudflare Cron triggers the bookmark sync + processing pipeline: pull new Twitter/X bookmarks, deduplicate `pending` bookmarks, draft candidates via Claude API, write `candidates` with `decision: "undecided"` for the next weekday's `targetDate`.
3. If Josh bookmarks tweets later that night, `/cms/bookmarks` can manually re-sync Twitter/X bookmarks and then process selected or all pending bookmarks using the same Convex actions as the nightly job.
4. Josh opens the mobile-friendly CMS, reviews candidates, marks `keep`/`kill`, fills in `commentary`, writes the editor's note. Sets `briefs` status to `scheduled`.
5. At 6 AM ET, Cloudflare Cron triggers the publish action: validates schema, renders JSON/markdown/HTML/RSS, writes to R2, updates `briefs.status` to `published`, sends emails via Cloudflare Email Service.

**Delivery flow:**

- **TUI/CLI:** Go binary calls `GET /api/v1/today.json` with bearer token. Caches response locally. TUI renders.
- **Agents:** Same JSON endpoint. Documented schema, versioned URL.
- **RSS:** `GET /api/v1/feed/{token}.xml` returns full-content RSS.
- **Email:** Cloudflare Workers cron pulls all active users with `emailEnabled`, sends via `env.EMAIL.send()`.
- **Web:** Static-ish page at `/brief/{date}` fetches from R2 via edge cache. Token query param unlocks full content.

---

## 3. Convex Schema

The complete schema is below. All tables are explicitly listed; no implicit assumptions.

```typescript
// convex/schema.ts
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
    .index("by_captured_date", ["capturedDate"]),

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
```

---

## 4. JSON Schema (Public API Contract)

The single source of truth for what the API returns. Versioned. Agents pin to major versions.

```json
{
  "version": "1.0",
  "date": "2026-05-11",
  "edition": 47,
  "published_at": "2026-05-11T10:00:00Z",
  "editor_note": "Big day for open models. Three new releases worth your time, plus an MCP spec change that might break existing servers.",
  "items": [
    {
      "id": "2026-05-11-01",
      "title": "Anthropic ships MCP 0.4 with breaking auth changes",
      "summary": "The new spec consolidates the three previous auth flows into a single OAuth-based pattern. Existing servers will need updates by July.",
      "commentary": "If you've built an MCP server, budget half a day for the migration. The new flow is genuinely better but the migration guide is thin — expect to read source.",
      "category": "protocol",
      "tags": ["mcp", "anthropic", "breaking-change"],
      "links": [
        {
          "url": "https://example.com/spec",
          "label": "Spec",
          "type": "primary"
        },
        {
          "url": "https://example.com/migration",
          "label": "Migration guide",
          "type": "reference"
        }
      ],
      "source": {
        "type": "twitter",
        "url": "https://twitter.com/...",
        "author": "@username"
      },
      "importance": "high",
      "reading_time_seconds": 45
    }
  ],
  "stats": {
    "item_count": 7,
    "total_reading_time_seconds": 240
  }
}
```

**Preview vs. full version:**

When the request has no valid token (public web view), the response includes only:

- `version`, `date`, `edition`, `published_at`
- `items[].id`, `title`, `category`, `tags`, `importance`
- A `preview: true` flag at the root
- No `editor_note`, `summary`, `commentary`, `links`, `source`

When the request has a valid token, the full schema above is returned.

**Field stability rules:**

- Adding optional fields → patch version bump (1.0 → 1.1)
- Adding required fields or changing types → major version bump (1.x → 2.0), new URL path `/v2/`
- Removing fields → major version bump
- `id` values are permanent and globally unique. Never reused.

The JSON Schema spec lives at `packages/schema/v1.json` and is referenced from both the Go CLI and the TypeScript web app.

---

## 5. Web App (Next.js on Cloudflare Workers)

### 5.1 Deployment

- **Adapter:** `@opennextjs/cloudflare`
- **Wrangler config** declares bindings for:
  - R2 bucket: `BRIEFS_BUCKET`
  - KV namespace: `TOKENS_KV`, `RATE_LIMIT_KV`
  - Email binding: `EMAIL`
  - Environment vars: `CONVEX_URL`, `CONVEX_DEPLOY_KEY`, `ANTHROPIC_API_KEY`, `TWITTER_BEARER_TOKEN`, `CMS_AUTH_SECRET`
- **Compatibility date:** Current (e.g., `2026-05-01`), with `nodejs_compat` flag
- **Custom domains:** `thepull.dev` (apex), `www.thepull.dev` → 301 to apex
- **Preview deploys** on every PR via GitHub Action

### 5.2 Public Routes

| Route                          | Purpose                                           | Auth                                        |
| ------------------------------ | ------------------------------------------------- | ------------------------------------------- |
| `/`                            | Landing page                                      | None                                        |
| `/brief/[date]`                | Public web view of a specific brief               | Optional token query param for full content |
| `/brief/latest`                | Redirect to most recent published brief           | None                                        |
| `/archive`                     | Public archive index                              | None                                        |
| `/dashboard`                   | User token management                             | Magic link reauth                           |
| `/unsubscribe?token=xyz`       | One-click unsubscribe handler                     | Signed token                                |
| `/api/install`                 | Returns the install.sh shell script               | None                                        |
| `/api/v1/today.json`           | Today's brief JSON                                | Bearer token (full) or none (preview)       |
| `/api/v1/today.md`             | Today's brief markdown                            | Bearer token                                |
| `/api/v1/briefs/[date].json`   | Specific date's brief                             | Bearer token                                |
| `/api/v1/latest.json`          | Most recent published brief                       | Bearer token                                |
| `/api/v1/briefs.json?limit=30` | Array of recent briefs (metadata only by default) | Bearer token                                |
| `/api/v1/feed/[token].xml`     | Per-user RSS feed                                 | Token in URL path                           |
| `/api/v1/events`               | Analytics event ingestion                         | Bearer token, POST only                     |
| `/api/v1/auth/register`        | Email-based registration                          | None                                        |
| `/api/v1/auth/verify`          | Magic link code verification                      | None                                        |
| `/api/v1/auth/tokens`          | List/create/revoke tokens                         | Session cookie or bearer                    |
| `/api/v1/auth/me`              | Return current user info                          | Bearer token                                |

### 5.3 CMS Routes (single-user, Josh-only)

Protected by a hardcoded magic-link flow gated to `josh@joshferrara.com` (or whatever email Josh sets). No multi-user complexity.

| Route            | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `/cms`           | Today's candidates + editor's note + publish button        |
| `/cms/[date]`    | Specific date's draft (past dates editable for typo fixes) |
| `/cms/archive`   | Published briefs, searchable                               |
| `/cms/bookmarks` | Raw bookmark inbox, manual add form                        |
| `/cms/analytics` | Per-item stats, daily readership trends                    |
| `/cms/settings`  | Configure preferences, view logs                           |
| `/cms/login`     | Magic link login (only Josh's email accepted)              |

### 5.4 Landing Page

**Above the fold:**

- Headline: "The daily AI brief, delivered where you actually work."
- Subhead: "For developers who can't keep up with AI but need to. Weekday mornings, in your terminal, agent, inbox, or feed reader."
- Two tabs: **Terminal** | **Agent**, with a small "or get it by email" link below

**Terminal tab snippet:**

```
curl -fsSL https://thepull.dev/install | sh
pull login
```

**Agent tab snippet (a prompt block):**

```
Set up a daily AI brief for me:
1. Register at https://thepull.dev/api/v1/auth/register with my email
2. I'll click the verification link and provide you my token
3. Save the token to ~/.config/the-pull/agent-token
4. Add a cron job that fetches https://thepull.dev/api/v1/today.json
   with the token each morning at 8am and summarizes it for me
```

**Email tab (deemphasized):**

- Inline email capture form: "Get the brief in your inbox each morning"
- Submit → magic link signup flow

**Below the fold:**

- Today's brief preview (titles + categories only, "unlock with signup" CTA)
- "What's in it" — 3-4 sentences about editorial approach
- "How it works" — 3-step diagram (curate → render → deliver)
- Testimonials section (placeholder until populated)
- Footer with about, contact, RSS link, GitHub link

### 5.5 Web Brief View (`/brief/[date]`)

- Renders the brief from R2 via edge cache
- Without token: shows preview (titles, categories, importance, public summary). Footer prominently says "Unlock with signup" with CTA.
- With token query param `?t=...`: shows full content
- Token URL is a short-lived HMAC-signed token generated by TUI when user hits `w` keybind (24-hour expiry), NOT the raw user token
- Open Graph metadata for social sharing: `og:image` generated per-brief, `og:title` = "The Pull — Edition #47", `og:description` = editor's note
- "Get this in your terminal" footer with install command on every page

### 5.6 Dashboard (`/dashboard`)

User-facing. After magic-link reauth, user can:

- View account email, signup date
- View all active tokens grouped by scope (API, RSS, CLI)
- Copy any token to clipboard (plain text, displayed fully)
- Create new tokens with custom labels
- Revoke tokens (sets `revokedAt`, doesn't delete)
- Toggle email delivery on/off
- Toggle analytics opt-out
- Change timezone
- Unsubscribe entirely (sets `status: "unsubscribed"`, revokes all tokens)

### 5.7 CMS (Mobile-First)

This is the critical piece for daily ops. Optimized for phone use at 11 PM.

**`/cms` (today's draft view):**

- Sticky header: target date, status indicator, item count (e.g., "5 kept / 12 total")
- Editor's note text area at top
- List of candidate cards. Each card shows:
  - Title (tappable to edit)
  - Category badge, importance flag
  - One-line summary preview (truncated)
  - Three action buttons: **Keep** (green), **Kill** (red), **Edit** (gray)
  - Swipe-right to keep, swipe-left to kill on mobile
- "Add manual item" button at the bottom
- Floating action button: "Preview & Schedule"

**Edit drawer (slide-up modal):**

- Title (text input)
- Summary (textarea, agent-prefilled)
- **Commentary (textarea, large, focused — the only field you really need to write)**
- Category (segmented control)
- Tags (chip input)
- Links (repeatable group: URL, label, type)
- Importance (segmented: low/medium/high)
- Reading time (auto-calculated from text, manual override)
- Source (read-only display from bookmark)
- "Save & Next" button

**Preview screen:**

- Renders the brief as it'll appear in email/web
- "Schedule for 6 AM ET" primary button
- "Publish now" secondary (override)
- "Save as draft" tertiary

**`/cms/bookmarks`:**

- Pending bookmark inbox
- Manual paste form: URL + optional note
- Each bookmark card: source, URL, captured time, status
- "Sync X bookmarks" trigger: pull latest Twitter/X bookmarks, insert new rows as `pending`, skip existing bookmarks by canonical URL/source ID, and show added/skipped counts
- "Process pending" trigger: run the agent on selected bookmarks or all currently `pending` bookmarks

**`/cms/analytics`:**

- Today: total views, unique sessions, breakdown by channel
- 7-day rolling chart: subscribers, active sessions, top-saved items
- Per-item view: which items got most saves/clicks across last 30 days

### 5.8 Authentication Flow

**Public signup/login (magic link):**

1. User submits email at `/api/v1/auth/register`
2. Server creates pending `authCode` with 15-min expiry, sends email via Cloudflare Email Service with link `https://thepull.dev/verify?code=...`
3. User clicks link, hits `/verify` page which calls `/api/v1/auth/verify`
4. Server validates code, marks consumed, creates or updates `users` row with `emailVerified: true`
5. Server creates initial CLI-scoped token, returns to user
6. For CLI flow: `pull login` opens a localhost listener on a random port, opens browser to `/verify?code=...&cli_callback=http://localhost:PORT`, user verifies, browser posts token back to localhost listener, CLI saves to OS keychain
7. For web flow: server sets a session cookie, redirects to `/dashboard`

**CMS auth (Josh only):**

- Same magic link flow but `/cms/login` rejects any email other than the configured `CMS_EMAIL` env var
- Session cookie set with `SameSite=Strict`, `HttpOnly`, `Secure`
- 30-day expiry

**Token validation on API requests:**

- Bearer header `Authorization: Bearer tp_...`
- Lookup in Convex `tokens.by_token` index; cache result in Workers KV for 5 minutes
- Reject if `revokedAt` is set, or user `status !== "active"`
- Update `lastUsedAt` async (don't block request)
- Increment rate-limit counter (see 5.9)

### 5.9 Rate Limiting

- Per-token, per-day, stored in Workers KV with TTL of 25 hours
- Limits:
  - Free tier API: 200 requests/day per token
  - RSS: 96 requests/day (every 15 min realistically)
  - CLI: 200 requests/day per token
- Exceed limit → 429 response with `Retry-After: <seconds until midnight UTC>` header
- Token hash key: `ratelimit:{sha256(token)}:{YYYY-MM-DD}`

### 5.10 Analytics Event Ingestion

`POST /api/v1/events`:

```json
{
  "type": "item_save",
  "brief_date": "2026-05-11",
  "item_id": "2026-05-11-03",
  "channel": "tui"
}
```

Server:

1. Validate token, get user
2. If `analyticsOptOut: true`, return 204 without logging
3. Compute `sessionHash = sha256(token + YYYY-MM-DD_in_user_timezone)`
4. Insert event row in Convex via async mutation (fire and forget)
5. Return 204

Batched endpoint also supported: `POST /api/v1/events/batch` accepts an array, for the TUI to flush queued events on quit.

### 5.11 Render Pipeline

Single source of truth: each brief's curated `candidates` (with `decision: "keep"`) plus the editor's note compile into the canonical JSON. From that JSON, generate:

- **Markdown** (for CLI text output and email plain-text fallback)
- **HTML email** (using React Email templates, rendered server-side)
- **Web HTML** (Next.js page renders from JSON)
- **RSS XML** (full content in `<description>`, proper `<guid>` per item)
- **Open Graph image** (generated server-side via `@vercel/og` equivalent in Workers — likely Cloudflare's image generation API or static template with item count overlay)

All five outputs are uploaded to R2 on publish:

- `briefs/2026-05-11/brief.json`
- `briefs/2026-05-11/brief.md`
- `briefs/2026-05-11/brief.html`
- `briefs/2026-05-11/feed.xml` (full archive RSS, regenerated)
- `briefs/2026-05-11/og.png`

R2 keys are recorded in the `briefs` table for retrieval. The public JSON API endpoints proxy from R2 with appropriate `Cache-Control` headers (5 min for `today`, 24 hours for archive).

### 5.12 Email Sending

**Library abstraction in `lib/email.ts`:**

```typescript
interface EmailProvider {
  send(args: {
    to: string;
    subject: string;
    html: string;
    text: string;
    headers?: Record<string, string>;
  }): Promise<{ id: string }>;
}
```

Two implementations: `CloudflareEmailProvider` (uses `env.EMAIL.send()`) and `ResendEmailProvider` (uses Resend API). Selected at runtime via `EMAIL_PROVIDER` env var. Default: Cloudflare.

**Daily send flow (triggered by Cron Trigger at 6 AM ET):**

1. Query published brief for today
2. Query all `users` where `status: "active"` AND `preferences.emailEnabled: true`
3. For each user, render personalized HTML email (includes unique tracking pixel URL, UTM-tagged links with `utm_content={brief_date}`, personalized unsubscribe link)
4. Send via provider, log delivery
5. Throttle to provider limits (Cloudflare's per-minute caps TBD; assume 100/sec safely)

**Email templates** stored in `apps/web/lib/email/templates/`, written with React Email.

**Deliverability hygiene:**

- Include `List-Unsubscribe` header (one-click)
- DKIM/SPF/DMARC auto-configured via Cloudflare DNS
- Bounce handling: incoming Email Routing worker catches bounces, marks user `status: "bounced"` after 2 hard bounces
- Plain-text alternative always sent

### 5.13 Cron Triggers (Cloudflare)

Configured in `wrangler.jsonc`:

| Schedule (UTC) | Job                | Purpose                                                                   |
| -------------- | ------------------ | ------------------------------------------------------------------------- |
| `0 2 * * 1-5`  | `processBookmarks` | 9 PM Central — sync Twitter/X bookmarks, deduplicate, generate candidates |
| `0 11 * * 1-5` | `publishBrief`     | 6 AM ET — publish scheduled brief, render outputs, send emails            |
| `0 12 * * 1-5` | `rollupStats`      | 7 AM ET — aggregate yesterday's events into `itemStats` and `briefStats`  |
| `0 0 * * *`    | `cleanupAuthCodes` | Daily — delete expired/consumed auth codes older than 7 days              |
| `0 0 * * 0`    | `weeklyReport`     | Sunday midnight — email Josh his weekly metrics summary                   |

---

## 6. CLI/TUI (Go)

### 6.1 Binary Name & Distribution

- Binary: `pull`
- Distributed via:
  - Homebrew: `brew install joshferrara/tap/pull`
  - Scoop: `scoop bucket add josh https://github.com/josh-ferrara/scoop-bucket && scoop install pull`
  - Direct: `curl -fsSL https://thepull.dev/install | sh`

**Pre-launch check:** verify `pull` is not a common system binary. If a collision exists on common dev machines, fall back to `the-pull` as the binary name and update all documentation.

### 6.2 Commands

| Command                        | Purpose                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| `pull`                         | Launch TUI (default)                                          |
| `pull tui`                     | Same as `pull` (explicit)                                     |
| `pull print`                   | Print today's brief as markdown to stdout                     |
| `pull print --json`            | Print today's brief as JSON                                   |
| `pull print --date 2026-05-11` | Print specific date                                           |
| `pull login`                   | Email magic link auth flow                                    |
| `pull logout`                  | Clear stored token                                            |
| `pull whoami`                  | Show authenticated email                                      |
| `pull search <query>`          | Search across local archive                                   |
| `pull saved`                   | TUI view of saved items                                       |
| `pull config get/set <key>`    | Manage local config                                           |
| `pull version`                 | Print version                                                 |
| `pull update`                  | Self-update check (Homebrew/Scoop noop, direct install bumps) |

### 6.3 TUI (Bubble Tea)

**Architecture:** Elm-style. Business logic (fetching, caching, state) in plain Go packages (`internal/api`, `internal/store`, `internal/cache`). TUI is a thin presentation layer that calls into them.

**Screens:**

1. **Today view (default):**
   - Header: "The Pull — Edition #47 — May 11, 2026 — 7 items — 4 min read"
   - Two panes: left list (items), right detail (selected item rendered with Glamour)
   - Footer keybinds: `↑↓/jk` navigate, `enter` open link, `s` save, `w` web view, `?` help, `q` quit

2. **Detail view (item selected):**
   - Full markdown render of summary + commentary
   - Links section (numbered, press number to open)
   - Source attribution
   - Reading time, importance badge

3. **Saved view (Tab or `2`):**
   - List of locally-bookmarked items across all dates
   - Same right-pane detail
   - `d` to unsave

4. **Search view (`/`):**
   - Fuzzy search across cached briefs
   - Filter by tag, category, date range
   - Real-time results

5. **Help (`?`):**
   - All keybinds, navigation, status info (cache age, last fetch time)

**Theming:** Catppuccin Mocha via Lip Gloss. Theme tokens in `internal/tui/theme.go`. Hardcoded — no theme switching in v1.

**Keybindings (Vim-flavored):**

- `j/k` or `↓/↑`: navigate list
- `g/G`: top/bottom
- `enter`: open primary link in browser
- `1-9`: open specific link by number
- `s` or `b`: bookmark/save current item (toggles)
- `w`: open today's web view in browser (with signed URL token)
- `W`: open this item's permalink page
- `tab` or `2`: switch to saved view
- `1`: back to today
- `/`: search
- `r`: refresh from server
- `?`: help
- `q` or `esc`: quit

### 6.4 Local Storage

| Path                                      | Purpose                                         | Format                      |
| ----------------------------------------- | ----------------------------------------------- | --------------------------- |
| `~/.config/the-pull/config.toml`          | User config (timezone, default view)            | TOML                        |
| OS keychain or `~/.config/the-pull/token` | API bearer token                                | Plain text (file mode 0600) |
| `~/.local/share/the-pull/cache/briefs/`   | Cached brief JSON files                         | One per date                |
| `~/.local/share/the-pull/data.db`         | SQLite for saved items, read state, event queue | SQLite3                     |
| `~/.local/share/the-pull/events.log`      | Pending events to flush on next online sync     | NDJSON                      |

**SQLite schema:**

```sql
CREATE TABLE saved_items (
  item_id TEXT PRIMARY KEY,
  brief_date TEXT NOT NULL,
  title TEXT NOT NULL,
  saved_at INTEGER NOT NULL,
  cached_json TEXT NOT NULL
);

CREATE TABLE read_state (
  item_id TEXT PRIMARY KEY,
  brief_date TEXT NOT NULL,
  read_at INTEGER NOT NULL
);

CREATE TABLE pending_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_json TEXT NOT NULL,
  queued_at INTEGER NOT NULL
);
```

**Token storage preference:** OS keychain via `github.com/zalando/go-keyring` (macOS Keychain, Linux libsecret, Windows Credential Manager). Fall back to flat file with 0600 perms if keychain unavailable.

### 6.5 Fetch & Cache Logic

On TUI launch:

1. Check cache freshness: if `~/.local/share/the-pull/cache/briefs/today.json` exists and is <5 minutes old, use it
2. Otherwise, attempt fetch from `https://thepull.dev/api/v1/today.json`
3. On success, write to cache and proceed
4. On failure (offline, server error), fall back to most recent cached brief, show "offline" indicator
5. Background goroutine: flush pending events from SQLite to `/api/v1/events/batch`

`pull print` follows the same logic but exits after printing.

### 6.6 Auto-detection of stdout

When `pull` is invoked with no args:

- If stdout is a TTY → launch TUI
- If stdout is piped → print markdown
- Override with explicit `pull tui` or `pull print`

This lets agents do `pull | grep MCP` cleanly while humans get the TUI.

### 6.7 Build & Release

**GoReleaser config** (`apps/cli/.goreleaser.yml`) builds:

- `darwin/amd64`, `darwin/arm64`
- `linux/amd64`, `linux/arm64`
- `windows/amd64`

On every git tag matching `cli-v*`:

1. Cross-compile all targets
2. Generate SHA256 checksums
3. Sign with cosign
4. Create GitHub Release with all artifacts
5. Auto-update `josh-ferrara/homebrew-tap` formula
6. Auto-update `josh-ferrara/scoop-bucket` manifest
7. Regenerate `install.sh` and upload to R2 at `install/latest.sh`

**Install script** (served at `https://thepull.dev/install`):

- Wrapped in `main()` function, only called on last line (protects against partial download exec)
- `set -euo pipefail` at top
- Detects OS/arch
- Downloads correct binary to `~/.local/bin/pull` (no sudo)
- Verifies SHA256 against value baked into script
- Adds `~/.local/bin` to PATH if not present (via shell rc file detection)
- Prints next-step instructions: "Run `pull login` to get started"

---

## 7. Bookmark Capture & Agent Processing

### 7.1 Capture Sources

**Twitter/X:** Scheduled polling and the CMS "Sync X bookmarks" action hit the Twitter/X API for Josh's bookmarks (or likes). Tweets not already in `bookmarks` table get inserted with `status: "pending"`; existing tweets are skipped by source ID or canonical URL. Requires `TWITTER_BEARER_TOKEN` and Josh's user ID configured. Note: Twitter/X API access tier and pricing should be confirmed at build time since both have changed frequently — this may require a paid tier.

**Manual:** CMS `/cms/bookmarks` has a paste form. URL + optional note → inserts as `pending`.

**iOS Share Sheet:** A simple iOS Shortcut configured to POST to `https://thepull.dev/api/v1/bookmarks` with the URL and Josh's admin token. Setup instructions documented in CMS settings.

### 7.2 Bookmark Agent Processing

Triggered automatically at 9 PM Central by Cron and manually from `/cms/bookmarks`. The nightly cron first runs the Twitter/X bookmark sync, then processes all pending bookmarks. The manual CMS flow can run the same sync step on demand and can process either selected bookmarks or all currently pending bookmarks. Processing runs as a Convex action:

1. Query all `bookmarks` where `status: "pending"`
2. Fetch URL content for each (with sensible timeout, skip on failure)
3. Group bookmarks that appear to be the same story (URL similarity, content embedding similarity via Claude — TBD heuristic)
4. For each group, call Claude API with structured prompt:
   - Input: bookmark URLs, content excerpts, source authors
   - Output (JSON): `{title, summary, category, tags, importance, links, suggested_commentary_angle}`
5. Insert a `candidates` row with `targetDate = next_weekday`, `decision: "undecided"`, agent-drafted fields populated
6. Update bookmarks to `status: "processed"`, link them via `candidateId`

Target candidate count: 15–25 per night. The CMS lets Josh kill down to 7 final.

### 7.3 Claude API Prompt Strategy

System prompt establishes voice: factual summaries, no hype words ("revolutionary," "game-changing"), focus on what readers should _do_ with this information. Output strict JSON matching schema. Temperature 0.3 for consistency.

Prompt template versioned in `apps/web/convex/prompts/v1.ts` so prompt changes are tracked.

---

## 8. Deployment & CI/CD

### 8.1 Environments

- **Production:** `thepull.dev`, Cloudflare Worker `the-pull-prod`
- **Preview:** `*.preview.thepull.dev`, per-branch Workers
- **Local dev:** `wrangler dev` for web app, `npx convex dev` for Convex, `go run ./cmd/pull` for CLI

### 8.2 GitHub Actions

**`.github/workflows/web-deploy.yml`** (on push to `main`, changes in `apps/web/**`):

1. pnpm install
2. Run tests, typecheck
3. Build with OpenNext
4. Deploy via Wrangler
5. Run smoke test (curl `/api/health`)

**`.github/workflows/cli-release.yml`** (on tag matching `cli-v*`):

1. Run Go tests
2. Run GoReleaser
3. Verify Homebrew tap update
4. Trigger `install.sh` regeneration and R2 upload

**`.github/workflows/ci.yml`** (on every PR):

1. Lint both apps
2. Run unit tests
3. Typecheck web app
4. Build CLI for current platform (sanity check)

### 8.3 Secrets

Stored in GitHub Actions secrets and Cloudflare Worker secrets:

- `CONVEX_DEPLOY_KEY`
- `ANTHROPIC_API_KEY`
- `TWITTER_BEARER_TOKEN`
- `CMS_AUTH_SECRET` (HMAC key for session cookies, signed URLs)
- `CLOUDFLARE_API_TOKEN`
- `COSIGN_PRIVATE_KEY` (for CLI binary signing)
- `RESEND_API_KEY` (fallback)

---

## 9. Launch Plan

### 9.1 Pre-Launch (2 weeks before public launch)

- Buy `thepull.dev` and configure Cloudflare DNS
- Set up Cloudflare account, Workers paid plan, Email Service domain verification
- Convex project provisioned
- Build landing page with email capture (no product behind it yet)
- Share landing page in 5–10 dev communities (specific list TBD: Hacker News, dev Twitter, relevant subreddits, friends' Slacks, Lobsters)
- Target: 200 email signups before product launch. If you can't hit 200, the product won't fix that — diagnose before building further.

### 9.2 Soft Launch (Week 1)

- Web app live with landing + dashboard + email signup
- Begin daily curation publicly (even with small list)
- Email delivery working
- Public web brief views live
- CLI/TUI in private beta — share with 10 friends for feedback

### 9.3 Public CLI Launch (Week 3–4)

- CLI hits Homebrew, Scoop, install script
- JSON API publicly documented at `/docs` (separate marketing page)
- Agent setup guides published
- RSS feed enabled
- Submit to launches: Hacker News "Show HN," relevant Twitter, dev newsletters that cover other newsletters

### 9.4 Success Metrics (First 90 Days)

- **Subscribers:** 1,000 confirmed weekly actives
- **CLI installs:** 200+
- **Agent endpoint usage:** 50+ unique tokens hitting JSON daily
- **Forward signal:** at least 10% of new signups self-report "forwarded by a friend"
- **Retention:** 7-day rolling active rate >40%

If hitting these, begin sponsor outreach. Target rates: $20–50 CPM at 5K+ engaged actives.

---

## 10. Open Decisions & Risks

### 10.1 Decisions Deferred to Build Time

- **Binary name collision check.** Confirm `pull` is safe before locking in. Fallback: `the-pull`.
- **Twitter API tier.** Confirm pricing and rate limits at build time.
- **Cloudflare Email pricing.** Beta pricing TBD. Keep Resend abstraction in place to switch if pricing comes in unfavorable.
- **OG image generation in Workers.** Verify Cloudflare's image generation options at build time; may need a small Satori-based renderer or just static templates with overlay text.

### 10.2 Known Risks

- **Curation burnout.** The daily obligation will be hardest in months 2–3 when novelty wears off but audience is small. Mitigation: pre-identify backup curator, write "best of the week" templates for off days, set explicit holiday calendar.
- **Quality drift if agent output is shipped raw.** Discipline required: never skip the human commentary step. The commentary is the moat.
- **Cloudflare Email beta instability.** Mitigation: Resend abstraction. Plan to switch in an afternoon if needed.
- **Token leakage via URL params for RSS.** Mitigation: per-channel tokens (RSS-scoped tokens are revocable separately from API tokens), document risk in dashboard.
- **Discovery channel beyond direct sharing.** No SEO plan beyond public brief archive. Plan to invest in Twitter presence (one post per edition with thread of best items) once product is stable.

### 10.3 Explicitly Out of Scope for v1

- Multi-user CMS, multiple curators
- Push notifications
- Webhook delivery to agents
- Cross-device bookmark sync
- Paid tier
- Mobile native apps
- Comment system on web briefs
- Search across full archive content (only metadata search at first)
- Multi-language briefs
- Newsletter referral program (beyond simple self-reported source)

---

## 11. Build Order

A suggested sequence for implementation, weighted toward shipping the riskiest pieces first.

### Phase 1 — Foundations (Week 1)

1. Monorepo setup: Turborepo, pnpm workspaces, shared schema package
2. Convex project initialized, schema deployed
3. Next.js app scaffolded with OpenNext, deployed to Cloudflare Workers at staging URL
4. Landing page with email capture working
5. Cloudflare Email Service domain configured, test send working

### Phase 2 — CMS Core (Week 2)

6. Magic link auth for CMS (Josh-only gate)
7. Bookmarks manual paste UI
8. Convex action for agent processing (Claude API integration)
9. Candidates list view, edit drawer, keep/kill/edit flow
10. Editor's note, preview, schedule

### Phase 3 — Publishing & Delivery (Week 3)

11. Render pipeline (JSON, markdown, HTML, RSS) to R2
12. Public JSON API endpoints with token auth
13. Daily email send Cron Trigger
14. Public web brief view (preview + full versions)
15. User dashboard with token management

### Phase 4 — CLI/TUI (Week 4)

16. Go CLI scaffold with Cobra, basic `print` command
17. Login flow (browser callback to localhost)
18. Bubble Tea TUI: today view, detail pane, Catppuccin theme
19. Saved items (SQLite), search
20. GoReleaser pipeline, Homebrew tap, Scoop bucket, install script

### Phase 5 — Polish & Launch (Week 5)

21. Analytics ingestion + rollups
22. Mobile CMS testing/polish
23. Twitter API integration for bookmark capture
24. iOS Share Sheet shortcut
25. Landing page polish, agent docs, RSS docs
26. Soft launch, friends-and-family beta
27. Public launch

---

## 12. Final Notes for the Implementing Agent

- **Type safety is non-negotiable.** Shared schema package, Convex's generated types, Go structs that match the JSON schema. Validate at boundaries.
- **Mobile-first for the CMS.** It will be used on a phone at 11 PM. Optimize for that.
- **Cloudflare Worker size limits matter.** 3 MiB free, 10 MiB paid. Keep dependencies tight, especially in the Next.js bundle.
- **Test the install script on a clean macOS, Linux (Ubuntu), and Windows machine before launch.**
- **Cloudflare Email Service is beta.** Build the provider abstraction first, default to Cloudflare, keep Resend implementation hot-swappable.
- **Don't over-engineer the editor.** The CMS exists to remove friction from one specific daily task. Resist the urge to make it a generic CMS.
- **Token security through obscurity is bad; minimal entropy + plain text + reasonable rate limiting is good enough for this stakes level.** 32 bytes of randomness, `tp_` prefix.
- **Every output channel reads from the same JSON.** No format-specific data living separately. The render pipeline is the only place format-specific work happens.
- **Cache aggressively at the edge.** Briefs don't change after publish. Set `Cache-Control: public, max-age=300, s-maxage=86400, stale-while-revalidate=86400` on public API responses.

---

End of specification. This document is the source of truth for v1. Material deviations should be discussed and the spec updated before implementation.
