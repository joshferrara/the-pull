# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

pnpm + turbo monorepo with a Go sub-tree. JS workspaces are `apps/web` and `packages/*` (see `pnpm-workspace.yaml`); `apps/cli` is a Go module and is **not** a pnpm workspace.

- `apps/web` — Next.js 15 app deployed to Cloudflare Workers via OpenNext. All HTTP surface (marketing, `/cms`, `/dashboard`, `/api/v1/*`, internal cron endpoints).
- `apps/web/convex` — Convex backend (schema, queries, mutations, actions, prompts, crons). Single source of truth for state.
- `apps/cli` — Go CLI + Bubble Tea TUI, distributed via GoReleaser → Homebrew tap + Scoop bucket + `curl|sh`.
- `packages/schema` — Versioned JSON schema (`v1.json`) + TS types (`types.ts`) for the public API. Shared by web and any external clients.
- `packages/shared` — Markdown/RSS render utilities used by both API responses and email templates.
- `docs/spec.md` — Authoritative product/implementation spec. `docs/runbook.md` — what's live, what needs manual setup, daily ops.

## Top-level commands

```bash
pnpm install
pnpm dev          # turbo: starts web (next dev) + any other workspace dev tasks
pnpm build        # turbo: next build, packages typecheck, etc.
pnpm typecheck
pnpm lint
pnpm test
```

Single-workspace targeting (faster, avoids touching the CLI which isn't in pnpm):

```bash
pnpm --filter @the-pull/web dev
pnpm --filter @the-pull/web exec convex dev       # regenerates convex/_generated
pnpm --filter @the-pull/web exec wrangler dev     # local Cloudflare Worker
pnpm --filter @the-pull/web typecheck
pnpm --filter @the-pull/web lint
pnpm --filter @the-pull/web exec opennextjs-cloudflare build
pnpm --filter @the-pull/web exec opennextjs-cloudflare preview
pnpm --filter @the-pull/web exec opennextjs-cloudflare deploy
pnpm --filter @the-pull/web cf-typegen            # regenerate cloudflare-env.d.ts after wrangler.jsonc changes
```

CLI (separate module, run from `apps/cli`):

```bash
go run .                                  # launch TUI
go vet ./... && go build ./... && go test ./...
go test ./internal/cache -run TestName    # single test
goreleaser release --snapshot --clean     # local release dry-run; needs cosign + tap tokens for full
```

CI runs `pnpm typecheck`, `@the-pull/web lint`, `@the-pull/web build`, then `go vet/build/test` (see `.github/workflows/ci.yml`).

## Web app architecture

**Runtime: Cloudflare Workers via OpenNext.** `next build` is not the deployable artifact — `opennextjs-cloudflare build` rewrites it into `.open-next/` and `custom-worker.ts` is what `wrangler.jsonc` points `main` at. The custom worker re-exports OpenNext's `fetch` handler unchanged and adds its own `scheduled()` handler.

**Cron dispatch is duplicated on purpose.** `wrangler.jsonc` `triggers.crons` + `custom-worker.ts` `scheduled()` map cron expressions to Convex actions via `runConvex()` (HTTP POST to `${CONVEX_URL}/api/run/<module>/<fn>`). The same schedules are *also* registered inside Convex (`apps/web/convex/crons.ts`) as a redundancy in case the Worker is down. When adding a cron, update **both** `wrangler.jsonc` + `custom-worker.ts` CRON_MAP **and** `convex/crons.ts`.

**Bindings (`wrangler.jsonc`).** `BRIEFS_BUCKET` (R2, published artifacts), `NEXT_INC_CACHE_R2_BUCKET` (OpenNext cache), `TOKENS_KV` (5-min bearer-token cache), `RATE_LIMIT_KV` (per-token-per-day counters), `WORKER_SELF_REFERENCE` (self service binding), `ASSETS` (static). Email `send_email` binding is commented out until Email Routing is set up; production currently uses Resend via `EMAIL_PROVIDER=resend`.

**Convex client.** Always go through `lib/convex.ts` (`convexClient()`). The Worker reads `CONVEX_URL` from Cloudflare env via `lib/env.ts` `bindings()`; the `cloudflare-env.d.ts` (generated) types the bindings — re-run `pnpm cf-typegen` after touching `wrangler.jsonc`.

**Public API.** Versioned under `/api/v1/*`. Shape is defined by `@the-pull/schema` (`packages/schema/types.ts` + `v1.json`). Two response shapes: a public *preview* and an authenticated full payload — `lib/render.ts` `shapeBrief(brief, hasToken)` picks via `toPreview()` from the schema package. Bearer auth flows through `lib/tokens.ts` `authenticateBearer` (Convex lookup → KV cache for 300s). Rate limits live in `RATE_LIMIT_KV` keyed by `sha256(token):YYYY-MM-DD` with TTL ~25h; per-scope limits in `checkRateLimit` (`rss: 96`, others: `200`).

**Published artifacts live in R2, not Convex.** `publish.publishBrief` (Convex action) renders JSON/MD/HTML/RSS, writes them to `BRIEFS_BUCKET` under `briefs/<date>/*`, then flips the `briefs` row's status to `published` and stores the R2 keys. API routes read from R2 (`lib/r2.ts` `getBriefJson`) — they don't recompute from Convex documents. This is why edits to a published brief require a re-publish to take effect on the API.

**Internal endpoints (`/api/internal/*`)** are gated by `CMS_AUTH_SECRET` via `x-internal-secret` header and called from Convex actions (e.g., `send-brief-emails`, `publish-artifacts`). They are not for end users.

**CMS surface (`/cms`)** is curator-only (email gated by `CMS_EMAIL` var, currently `joshferrara@gmail.com`). It edits Convex `bookmarks` → `candidates` → `briefs` directly. `lib/cms-guard.ts` enforces the gate.

## Convex data model (`apps/web/convex/schema.ts`)

Pipeline: `bookmarks` (raw captures from Twitter/manual/RSS/share-sheet) → `candidates` (AI-drafted items, one per item per target date, `decision: undecided|keep|kill`) → `briefs` (one per date, `status: draft|scheduled|published`, points to ordered `candidates`). `users` + `authCodes` + `tokens` handle magic-link auth and bearer tokens (`tp_*` prefix). `events` are append-only telemetry; `itemStats` + `briefStats` are daily rollups computed by `crons_actions:dailyRollup`. `twitterAuth` stores the curator's OAuth 2.0 user-context token (required because `/2/users/:id/bookmarks` rejects app-only bearer).

Convex types are in `convex/_generated/` (gitignored). Run `convex dev` to regenerate; do not import the API surface without that having run.

## Convex prompts / agent

`convex/agent.ts` + `convex/prompts/v1.ts` drive the Anthropic agent that turns bookmarks into draft candidates. Called from `crons_actions:nightlyPipeline`. Categories and shape are enforced via Convex validators in `schema.ts` — agent output that doesn't validate fails the insertion.

## CLI architecture

`apps/cli/main.go` → `cmd/root.go` (Cobra). Default `pull` (no args) auto-detects TTY:
- TTY → `runTUI` (Bubble Tea, see `internal/tui/app.go` + Catppuccin theme in `theme.go`).
- piped → `runPrint` (markdown to stdout — enables `pull | grep MCP` for agent pipelines).

Layers (`internal/`): `api/` (HTTP client + types — must stay in sync with `packages/schema`), `auth/` (OS keychain via `zalando/go-keyring` w/ `~/.config/the-pull/token` 0600 fallback), `cache/` + `store/` (file cache + sqlite for saved/read state — `modernc.org/sqlite`, pure-Go, no CGO), `config/` (`~/.config/the-pull/config.toml`), `render/` (Glamour markdown).

`version`/`commit`/`date` are injected via `-ldflags` by GoReleaser; the `dev` defaults in `main.go` are expected for local builds.

## Release & deploy

- **Web** deploys on push to `main` touching `apps/web/**` or `packages/**` (`.github/workflows/web-deploy.yml`). It deploys Convex first (`convex deploy --yes`), then `opennextjs-cloudflare build`, then `wrangler deploy --config wrangler.jsonc`, then smoke-tests `/api/health`.
- **CLI** releases on `cli-v*` tags only (`.github/workflows/cli-release.yml`). The workflow strips `cli-` and creates a parallel local semver tag because OSS GoReleaser requires a tag on HEAD without a monorepo prefix. Artifacts are cosign-signed using `cosign.pub` (committed) + `COSIGN_PRIVATE_KEY` (secret).

## Conventions & gotchas

- **`custom-worker.ts` is `@ts-nocheck`-d intentionally.** It imports from `./.open-next/worker.js` which only exists after the OpenNext build. Don't try to fix the import.
- **Don't mock the Worker env in `apps/web/lib/*`.** Code reads bindings via `bindings()` and is expected to run under `wrangler dev` or in deployment. Pre-build typecheck (`pnpm typecheck`) runs without bindings.
- **Cron expressions must match in three places** when changing: `wrangler.jsonc`, `custom-worker.ts` CRON_MAP keys, and `convex/crons.ts` schedules.
- **API shape changes must go through `packages/schema`.** Bump `v1.json` and `types.ts` together; both web and CLI consume it. Breaking changes need a `v2` path.
- **Curator is a single user.** Avoid building generic multi-tenant scaffolding for CMS / Twitter auth flows; `twitterAuth` is keyed by `curatorEmail` for a reason.
- `.claude/` is gitignored. Convex `_generated/` is gitignored — fresh clones won't typecheck until `convex dev` runs once.

## User instructions (from global `~/.claude/CLAUDE.md`)

- Don't add Claude as a co-author on commits.
- Don't commit or push to origin unless asked.
