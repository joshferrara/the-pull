# Runbook — The Pull

What's deployed, what's validated end-to-end, what still needs you, and how to operate the system.

## Currently deployed

- **GitHub:** [`joshferrara/the-pull`](https://github.com/joshferrara/the-pull) (private, code pushed), [`joshferrara/homebrew-the-pull`](https://github.com/joshferrara/homebrew-the-pull), [`joshferrara/scoop-the-pull`](https://github.com/joshferrara/scoop-the-pull) (public, populated by GoReleaser on each `cli-v*` tag)
- **Cloudflare Worker:** [`the-pull-prod`](https://the-pull-prod.joshferrara.workers.dev) on the `joshferrara@gmail.com` account
- **Convex production:** `prod:dashing-sheep-168` (URL: `https://dashing-sheep-168.convex.cloud`) — schema, functions, indexes, crons all live
- **Convex dev:** `dev:jovial-shark-654` retained for local iteration
- **R2 buckets:** `the-pull-briefs`, `the-pull-next-cache`
- **KV namespaces:** `TOKENS_KV` (`e93cc437d4b24edd832d3801b8c4e82d`), `RATE_LIMIT_KV` (`64190c2878e84a918f23146015c55d23`)
- **Worker secrets:** `CMS_AUTH_SECRET`, `CONVEX_URL` (points to prod)
- **Convex prod env:** `CMS_AUTH_SECRET`, `SITE_URL`
- **GitHub Actions secrets** (on `joshferrara/the-pull`): `COSIGN_PRIVATE_KEY`, `COSIGN_PASSWORD`, `HOMEBREW_TAP_GITHUB_TOKEN`, `SCOOP_BUCKET_GITHUB_TOKEN`
- **Public cosign key:** committed at [`cosign.pub`](../cosign.pub)

## Validated end-to-end (live, against the prod stack)

| What                                              | How                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Publish action → R2 artifacts → status flip       | `publish.publishBrief` action; verified JSON/MD/HTML/RSS land in `briefs/<date>/*` and brief flips to `published` |
| Public API JSON contract (preview + full)         | `/api/v1/today.json` returns `preview: true` shape without auth, full shape with bearer          |
| Markdown delivery channel                         | `/api/v1/today.md` with bearer returns the canonical markdown render                             |
| By-date / listing / latest endpoints              | `/api/v1/briefs/<date>.json`, `/api/v1/briefs.json?limit=N`, `/api/v1/latest.json`                 |
| RSS                                                | `/api/v1/feed/<token>.xml` returns full-content RSS 2.0                                          |
| Auth (register → magic link → token issuance)      | `/api/v1/auth/register` → `/verify` → token returned + saved                                     |
| Bearer auth + KV cache                             | `authenticateBearer` consults Convex on first hit, then caches in `TOKENS_KV` for 300s            |
| Rate limiting middleware                           | 6-request burst returns 200; KV counter increments correctly under load                          |
| Event ingestion (POST /api/v1/events)              | Batch of 4 events → 3 inserted (the one without `briefDate` skipped by `forDate` query — correct) |
| Session hashing                                    | `sha256(token + day_in_user_tz)`; same session for same-day requests                              |
| Stats rollup                                       | `stats.rollupForDate` aggregated events into `briefStats` (`totalViews: 1`, `uniqueSessions: 1`) |
| Email send pipeline (with stub provider)           | Publish → 4 personalized emails captured; each with a signed `List-Unsubscribe` URL              |
| Unsubscribe loop                                   | Click the signed URL → `emailEnabled` flips to false; next publish goes to 3 subscribers         |
| Public web HTML routes                             | `/`, `/brief/<date>`, `/brief/latest` (redirect), `/archive` all render dynamically              |
| OG metadata                                        | `/brief/<date>` Open Graph tags include edition #, date, editor note                              |
| CLI build + run                                    | `pull login --token`, `whoami`, `print`, `print --json` all work against the deployed Worker     |
| GoReleaser pipeline                                | `goreleaser release --snapshot --clean` produces 5 platform archives + Homebrew cask + Scoop manifest |
| Cosign signing config                              | Public key in repo; `COSIGN_PRIVATE_KEY` + `COSIGN_PASSWORD` set as Actions secrets               |
| Health check                                       | `/api/health` returns `{ ok: true, ts: ... }`                                                      |
| Install script                                     | `/api/install` returns the curl\|sh-safe fallback installer (single `main` invocation at EOF)     |

## What still needs you (manual one-time setup)

| Step                          | How                                                                                                        | Why                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Buy `thepull.dev`             | Any registrar (Cloudflare Registrar is cheapest), nameservers → Cloudflare                                  | Spec calls for this exact domain                                   |
| Add zone to Cloudflare        | Dashboard → Add a site → `thepull.dev`                                                                      | Needed before custom-domain routes / Email Routing                 |
| Uncomment routes              | `apps/web/wrangler.jsonc`, uncomment the `routes` block, redeploy                                            | Binds `thepull.dev` and `www.thepull.dev` to the Worker            |
| Email Routing                 | Dashboard → Email → enable for `thepull.dev`; verify DNS records                                            | Required for the `send_email` Worker binding                       |
| Uncomment `send_email`        | `apps/web/wrangler.jsonc`, uncomment the `send_email` block, redeploy                                        | Worker can call `env.EMAIL.send(...)`                              |
| Switch off stub provider      | `apps/web/wrangler.jsonc` → `"EMAIL_PROVIDER": "cloudflare"` (or `"resend"` + `RESEND_API_KEY` secret)        | Send real emails                                                   |
| Update SITE_URL               | After domain works: change to `https://thepull.dev` in `wrangler.jsonc` vars + `convex env set SITE_URL`     | Public URLs and unsubscribe links use this                         |
| Anthropic API key             | `console.anthropic.com` → `wrangler secret put ANTHROPIC_API_KEY` AND `convex env set ANTHROPIC_API_KEY`     | Powers bookmark → candidate drafting                               |
| Twitter/X API                 | Set `TWITTER_BEARER_TOKEN` + `TWITTER_USER_ID` (Worker secret + Convex env)                                  | Powers automatic bookmark sync                                     |
| Tag a CLI release             | `git tag cli-v0.1.0 && git push --tags`                                                                      | GoReleaser builds + signs binaries, pushes to taps                 |

## Daily operations

- **Curation (Josh):** Bookmarks happen throughout the day. Open `/cms` on phone at ~11 PM, swipe through candidates, edit, schedule.
- **Auto-publish:** Convex cron `publish.publishScheduledBrief` fires daily at 11:00 UTC (6 AM ET). Renders → R2 → email send.
- **Stats rollup:** Convex cron `crons_actions.dailyRollup` fires at 12:00 UTC for yesterday's events.
- **Auth-code cleanup:** Daily at 00:00 UTC.

## Useful commands

```bash
# Install everything
pnpm install

# Dev loop
pnpm --filter @the-pull/web dev               # local Next dev
pnpm --filter @the-pull/web exec convex dev   # Convex dev (regenerates types)
pnpm --filter @the-pull/web exec wrangler dev # local Worker

# Build + deploy
pnpm --filter @the-pull/web exec opennextjs-cloudflare build
pnpm --filter @the-pull/web exec wrangler deploy

# CLI
cd apps/cli && go run .                                # launch TUI locally
cd apps/cli && goreleaser release --snapshot --clean   # local release dry-run
```

## Quick smoke tests

```bash
URL=https://the-pull-prod.joshferrara.workers.dev
curl -s $URL/api/health                          # → {"ok":true,...}
curl -s $URL/api/v1/today.json | jq             # preview
curl -fsS $URL/api/install | head -3            # installer

TOKEN=tp_...                                     # from /dashboard or /verify
curl -s -H "Authorization: Bearer $TOKEN" $URL/api/v1/auth/me | jq
curl -s -H "Authorization: Bearer $TOKEN" $URL/api/v1/today.json | jq

# Stub email provider debug (only while EMAIL_PROVIDER=stub):
SECRET=<CMS_AUTH_SECRET value>
curl -s -H "x-internal-secret: $SECRET" $URL/api/internal/stub-emails | jq
```

## Cron schedule (Convex side — see `apps/web/convex/crons.ts`)

| Schedule (UTC) | Job                                  |
| -------------- | ------------------------------------ |
| `0 2 * * 1-5`  | Nightly bookmark sync + agent draft  |
| `0 11 * * 1-5` | Publish today's scheduled brief      |
| `0 12 * * 1-5` | Roll up yesterday's analytics        |
| Daily 00:00    | Cleanup expired auth codes           |

Worker has no `scheduled()` handler — all cron logic runs in Convex.

## Test data on prod

The prod Convex deployment currently has 4 published smoke-test editions
(2026-05-12 through 2026-05-15) and 4 test subscribers
(`alice/bob/carol/smoke-test @example.com`). Bob is unsubscribed (validates
the unsubscribe flow). To purge before real launch, run the Convex one-shots
listed at the bottom of this file or use the Convex dashboard.
