# The Pull

A daily AI news brief for developers — delivered via TUI, CLI, JSON API, RSS, email, and web.

> The daily AI brief, delivered where you actually work.

See [`docs/spec.md`](./docs/spec.md) for the full implementation specification.

## Monorepo Layout

```
the-pull/
├── apps/
│   ├── web/        # Next.js app (CMS, marketing, API, web brief) on Cloudflare Workers
│   └── cli/        # Go CLI + Bubble Tea TUI
├── packages/
│   ├── schema/     # Shared JSON schema (single source of truth for API)
│   └── shared/     # Markdown render utilities
└── docs/           # Spec + design docs
```

## Quickstart

```bash
# Install JS deps
pnpm install

# Run web app + Convex dev
pnpm dev

# Run CLI (from apps/cli)
go run ./cmd/pull
```

## Tooling

| Layer       | Stack                                                      |
| ----------- | ---------------------------------------------------------- |
| Web + API   | Next.js + OpenNext + Cloudflare Workers                    |
| Database    | Convex                                                     |
| Storage     | Cloudflare R2 (briefs), Workers KV (tokens, rate limits)   |
| Email       | Cloudflare Email Service (with Resend fallback abstraction)|
| Cron        | Cloudflare Cron Triggers                                   |
| CLI/TUI     | Go + Cobra + Bubble Tea + Lip Gloss + Glamour              |
| Distribution| GoReleaser → Homebrew tap + Scoop bucket + curl\|sh        |
