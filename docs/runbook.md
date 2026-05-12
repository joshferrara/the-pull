# Runbook — The Pull

What's deployed, what's validated end-to-end, what still needs you, and how to operate the system.

## Currently deployed

- **GitHub:** [`joshferrara/the-pull`](https://github.com/joshferrara/the-pull) (private), [`joshferrara/homebrew-the-pull`](https://github.com/joshferrara/homebrew-the-pull) and [`joshferrara/scoop-the-pull`](https://github.com/joshferrara/scoop-the-pull) (public, empty — GoReleaser will populate)
- **Cloudflare Worker:** [`the-pull-prod`](https://the-pull-prod.joshferrara.workers.dev) on the `joshferrara@gmail.com` account
- **Convex:** `dev:jovial-shark-654` (URL: `https://jovial-shark-654.convex.cloud`) — schema, functions, indexes, crons all live
- **R2 buckets:** `the-pull-briefs`, `the-pull-next-cache`
- **KV namespaces:**
  - `TOKENS_KV` — id `e93cc437d4b24edd832d3801b8c4e82d`
  - `RATE_LIMIT_KV` — id `64190c2878e84a918f23146015c55d23`
- **Worker secrets:** `CMS_AUTH_SECRET`, `CONVEX_URL`
- **Convex env:** `CMS_AUTH_SECRET`, `SITE_URL`
- **GitHub Actions secrets** (on `joshferrara/the-pull`): `COSIGN_PRIVATE_KEY`, `COSIGN_PASSWORD`
- **Public cosign key:** committed at [`cosign.pub`](../cosign.pub) for users to verify CLI artifacts

## Validated end-to-end (live, against the deployed worker)

A test edition #1 was published as a smoke test. All of these were verified live:

- ✅ Convex `publish.publishBrief` action → renders JSON/MD/HTML/RSS → uploads to R2 → marks `briefs.status = published`
- ✅ `/api/v1/today.json` — preview shape when unauthenticated, full shape with token
- ✅ `/api/v1/today.md` — markdown render
- ✅ `/api/v1/briefs.json` — listing
- ✅ `/api/v1/briefs/[date].json` — by-date
- ✅ `/api/v1/latest.json` — latest published
- ✅ `/api/v1/feed/[token].xml` — RSS
- ✅ `/api/v1/auth/register` → `/verify` → token issued
- ✅ `/api/v1/auth/me` with bearer token
- ✅ `/brief/[date]` — public HTML view with preview/unlock
- ✅ `/brief/latest` — redirect to current
- ✅ `/archive` — public archive list
- ✅ `/api/install` — fallback installer script
- ✅ `/api/health` — healthcheck
- ✅ CLI `pull login --token`, `pull whoami`, `pull print`, `pull print --json` — all hit the live API and render correctly

## What still needs you (manual one-time setup)

| Step                          | How to do it                                                                                                                          | Why                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Buy `thepull.dev`             | Any registrar (Cloudflare Registrar is cheapest), nameservers → Cloudflare                                                            | Spec calls for this exact domain                                   |
| Add zone to Cloudflare        | Dashboard → Add a site → `thepull.dev`                                                                                                | Needed before custom-domain routes work                            |
| Uncomment routes              | `apps/web/wrangler.jsonc`, uncomment the `routes` block, redeploy                                                                     | Binds `thepull.dev` and `www.thepull.dev` to the Worker            |
| Email Routing                 | Dashboard → Email → enable for `thepull.dev`; verify DNS records auto-suggested by CF                                                 | Required for the `send_email` Worker binding                       |
| Uncomment `send_email`        | `apps/web/wrangler.jsonc`, uncomment the `send_email` block, redeploy                                                                 | Worker can then call `env.EMAIL.send(...)`                         |
| Anthropic API key             | Generate at console.anthropic.com → `wrangler secret put ANTHROPIC_API_KEY` AND `pnpm exec convex env set ANTHROPIC_API_KEY <value>` | Powers bookmark → candidate drafting                               |
| Twitter/X API                 | Apply for an X developer account → set `TWITTER_BEARER_TOKEN` + `TWITTER_USER_ID` (Worker secret and Convex env)                       | Powers automatic bookmark sync                                     |
| GoReleaser tap PAT            | GitHub → Settings → Developer settings → fine-grained token, scope: contents/RW on `homebrew-the-pull` + `scoop-the-pull`. Add to `joshferrara/the-pull` Actions secrets as `HOMEBREW_TAP_GITHUB_TOKEN` and `SCOOP_BUCKET_GITHUB_TOKEN` (same value) | GoReleaser pushes formula/manifest updates                         |
| Convex prod deployment        | `cd apps/web && pnpm exec convex deploy` (first time creates one); set its URL as the Worker `CONVEX_URL` secret                       | Move off the dev deployment for real traffic                       |
| Tag a CLI release             | After all the above: `git tag cli-v0.1.0 && git push --tags`                                                                          | GoReleaser builds binaries, pushes to taps, signs with cosign      |

## Daily operations

- **Curation (Josh):** Bookmarks happen throughout the day. Open `/cms` on phone at ~11 PM, swipe through candidates, edit, schedule.
- **Auto-publish:** Convex cron `publish.publishScheduledBrief` fires daily at 11:00 UTC (6 AM ET). Brief renders → R2 → email send (when Email Routing is enabled).
- **Stats rollup:** Convex cron `crons_actions.dailyRollup` fires at 12:00 UTC for yesterday's events.
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
cd apps/cli && go run .                                # launch TUI locally
cd apps/cli && goreleaser release --snapshot --clean   # local release dry-run
```

## Quick smoke tests

```bash
URL=https://the-pull-prod.joshferrara.workers.dev
curl -s $URL/api/health                          # → {"ok":true,...}
curl -s $URL/api/v1/today.json | jq             # → preview JSON of latest brief
curl -s $URL/api/v1/latest.json | jq            # → preview shape
curl -fsS $URL/api/install | head -3            # → fallback installer

# Authenticated:
TOKEN=tp_...                                     # from /dashboard or /verify
curl -s -H "Authorization: Bearer $TOKEN" $URL/api/v1/auth/me | jq
curl -s -H "Authorization: Bearer $TOKEN" $URL/api/v1/today.json | jq
```

## Cron schedule (Convex side — see `apps/web/convex/crons.ts`)

| Schedule (UTC) | Job                                  |
| -------------- | ------------------------------------ |
| `0 2 * * 1-5`  | Nightly bookmark sync + agent draft  |
| `0 11 * * 1-5` | Publish today's scheduled brief      |
| `0 12 * * 1-5` | Roll up yesterday's analytics        |
| Daily 00:00    | Cleanup expired auth codes           |

Worker has no `scheduled()` handler — all cron logic runs in Convex.

## Cleaning up the smoke-test brief

A test edition #1 was published for validation. To purge:

```bash
cd apps/web
node -e "
import('convex/browser').then(({ConvexHttpClient}) =>
  import('./convex/_generated/api.js').then(async ({api}) => {
    const c = new ConvexHttpClient('https://jovial-shark-654.convex.cloud');
    const b = await c.query(api.briefs.getByDate, { date: '2026-05-12' });
    if (b) console.log('Found smoke-test brief:', b._id, 'edit via /cms or delete in Convex dashboard');
  })
);"
```

Or just leave it as a sample edition until the first real one publishes.
