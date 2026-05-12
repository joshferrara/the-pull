# Runbook — The Pull

What's deployed, what still needs you, and how to operate the system.

## Currently deployed

- **Cloudflare Worker:** [`the-pull-prod`](https://the-pull-prod.joshferrara.workers.dev) on the `joshferrara@gmail.com` account
- **Convex:** `dev:jovial-shark-654` (URL: `https://jovial-shark-654.convex.cloud`) — schema, functions, indexes, crons all live
- **KV namespaces:**
  - `TOKENS_KV` — id `e93cc437d4b24edd832d3801b8c4e82d`
  - `RATE_LIMIT_KV` — id `64190c2878e84a918f23146015c55d23`
- **Secrets set on Worker:** `CMS_AUTH_SECRET`, `CONVEX_URL`
- **Secrets set on Convex:** `CMS_AUTH_SECRET`, `SITE_URL`

## What still needs you (manual one-time setup)

| Step                       | How to do it                                                                                                                          | Why                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Enable R2                  | Cloudflare dashboard → R2 Object Storage → Enable, agree to pricing                                                                   | Required for storing rendered brief artifacts and (optionally) Next.js cache         |
| Create R2 buckets          | `wrangler r2 bucket create the-pull-briefs` (+ optional `the-pull-next-cache`)                                                        | After R2 is enabled                                                                  |
| Uncomment R2 binding       | Edit `apps/web/wrangler.jsonc`, uncomment the `r2_buckets` block, redeploy                                                            | So the Worker can read/write briefs                                                  |
| Buy `thepull.dev`          | Any registrar (Cloudflare Registrar is cheapest), nameservers → Cloudflare                                                            | Spec calls for this exact domain                                                     |
| Add zone to Cloudflare     | Dashboard → Add a site → `thepull.dev`                                                                                                | Needed before custom-domain routes work                                              |
| Uncomment routes           | `apps/web/wrangler.jsonc`, uncomment the `routes` block, redeploy                                                                     | Binds `thepull.dev` and `www.thepull.dev` to the Worker                              |
| Email Routing              | Dashboard → Email → enable for `thepull.dev`; verify DNS records auto-suggested by CF                                                 | Required for the `send_email` Worker binding                                         |
| Uncomment `send_email`     | `apps/web/wrangler.jsonc`, uncomment the `send_email` block, redeploy                                                                 | Worker can then call `env.EMAIL.send(...)`                                           |
| Convex prod deployment     | `cd apps/web && pnpm exec convex deploy` (the first time will create one); set `CONVEX_DEPLOY_KEY` as a Cloudflare secret             | Move off the dev deployment for real traffic                                         |
| Anthropic API key          | Generate at console.anthropic.com → `wrangler secret put ANTHROPIC_API_KEY` AND `pnpm exec convex env set ANTHROPIC_API_KEY <value>` | Powers bookmark → candidate drafting                                                 |
| Twitter/X API              | Apply for an X developer account → `wrangler secret put TWITTER_BEARER_TOKEN` + `TWITTER_USER_ID` (same on Convex)                    | Powers automatic bookmark sync; spec calls this out as a risk (10.1)                 |
| Cosign key for releases    | `cosign generate-key-pair` → add `COSIGN_PRIVATE_KEY` + `COSIGN_PASSWORD` to GitHub secrets                                            | GoReleaser signs CLI artifacts                                                       |
| Homebrew/Scoop bucket repos| Create `joshferrara/homebrew-the-pull` + `joshferrara/scoop-the-pull`, add a PAT with `repo` scope to GitHub secrets                       | GoReleaser pushes formula/manifest updates                                           |
| `CMS_EMAIL` value          | Confirm the email in `wrangler.jsonc` matches the curator's actual address (currently `josh@joshferrara.com`)                         | CMS magic link login only accepts this address                                       |

## Daily operations

- **Curation (Josh):** Bookmarks happen throughout the day. Open `/cms` on phone at ~11 PM, swipe through candidates, edit, schedule.
- **Auto-publish:** Convex cron fires `publish.publishScheduledBrief` daily at 11:00 UTC (6 AM ET). Brief renders → R2 → email send.
- **Stats rollup:** Convex cron fires `crons_actions.dailyRollup` at 12:00 UTC for yesterday's events.
- **Auth-code cleanup:** Daily at 00:00 UTC.

## Useful commands

```bash
# From repo root:
pnpm install                                 # install everything
pnpm --filter @the-pull/web dev              # local Next dev
pnpm --filter @the-pull/web exec convex dev  # Convex dev (regenerates types)
pnpm --filter @the-pull/web exec wrangler dev  # local Worker (against deployed Convex)

# Build + deploy web:
pnpm --filter @the-pull/web exec opennextjs-cloudflare build
pnpm --filter @the-pull/web exec wrangler deploy

# CLI:
cd apps/cli && go run .                      # launch TUI locally
cd apps/cli && goreleaser release --snapshot --clean   # local release dry-run
```

## Quick smoke tests

```bash
URL=https://the-pull-prod.joshferrara.workers.dev
curl -s $URL/api/health                          # → {"ok":true,...}
curl -s $URL/api/v1/today.json                   # → 404 no_published_brief until first edition
curl -fsS $URL/api/install | head -3             # → fallback installer script

# Authenticated:
TOKEN=tp_...                                     # from /dashboard or /verify
curl -s -H "Authorization: Bearer $TOKEN" $URL/api/v1/auth/me
```

## Cron schedule (Convex side — see `apps/web/convex/crons.ts`)

| Schedule (UTC) | Job                                  |
| -------------- | ------------------------------------ |
| `0 2 * * 1-5`  | Nightly bookmark sync + agent draft  |
| `0 11 * * 1-5` | Publish today's scheduled brief      |
| `0 12 * * 1-5` | Roll up yesterday's analytics        |
| Daily 00:00    | Cleanup expired auth codes           |

Worker has no `scheduled()` handler — all cron logic runs in Convex.
