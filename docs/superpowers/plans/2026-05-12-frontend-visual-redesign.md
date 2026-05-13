# Frontend Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the visual language of `apps/web` (landing, brief reader, archive, dashboard, verify) on a real design system with terminal-signature accents — Approach C from the spec.

**Architecture:** Layer terminal primitives (`<PromptLine>`, `<AsciiRule>`, `<TerminalPane>`, `<BoxFrame>`, `<MetaChip>`, `<EditionNumber>`, `<StatusBar>`, `<ScanlineOverlay>`) on top of the existing Catppuccin token system. Replace Inter with self-hosted Geist via `next/font`. Decompose monolithic page components into focused sub-components under `components/{landing,brief,archive,dashboard}/`. CSS animations only (no animation libs — Cloudflare Worker bundle constraint). Every animation guarded by `prefers-reduced-motion`.

**Tech Stack:** Next.js 15 (App Router) on Cloudflare Workers via OpenNext, React 19, Tailwind v4 (`@theme` tokens), JetBrains Mono (existing) + Geist (new via `geist` npm package), TypeScript 5.7. No test framework on web — verification is `pnpm typecheck` + `pnpm lint` + manual browser check on `pnpm --filter @the-pull/web dev`.

**Spec reference:** `docs/superpowers/specs/2026-05-12-frontend-visual-redesign-design.md`.

**Verification commands used throughout:**
- `pnpm --filter @the-pull/web typecheck` → must pass, no new errors.
- `pnpm --filter @the-pull/web lint` → must pass, no new errors.
- `pnpm --filter @the-pull/web dev` → manual browser check on `http://localhost:3000`.

**Commit message convention:** `Frontend redesign: <task summary>` — keeps the redesign easy to bisect later.

---

## File map

**New files (created during this plan):**
```
apps/web/components/terminal/
  ├─ prompt-line.tsx
  ├─ ascii-rule.tsx
  ├─ meta-chip.tsx
  ├─ edition-number.tsx
  ├─ box-frame.tsx
  ├─ terminal-pane.tsx
  ├─ status-bar.tsx
  ├─ scanline-overlay.tsx
  ├─ scanline-toggle.tsx
  └─ index.ts                # barrel export

apps/web/components/chrome/
  ├─ site-header.tsx
  └─ site-footer.tsx

apps/web/components/landing/
  ├─ hero.tsx
  ├─ install-tabs.tsx       # replaces old tab-switcher for landing
  ├─ live-preview-pane.tsx
  ├─ today-table.tsx
  ├─ the-deal.tsx
  ├─ faq.tsx
  └─ final-cta.tsx

apps/web/components/brief/
  ├─ brief-header.tsx
  ├─ anchor-rail.tsx
  ├─ brief-item.tsx
  ├─ progress-bar.tsx
  ├─ keyboard-shortcuts.tsx
  ├─ preview-gate.tsx
  └─ edition-nav.tsx

apps/web/components/archive/
  ├─ archive-table.tsx
  ├─ archive-filters.tsx
  ├─ archive-empty.tsx
  └─ archive-stats.tsx

apps/web/components/dashboard/
  ├─ preferences-panel.tsx
  ├─ tokens-panel.tsx
  ├─ token-reveal-card.tsx
  └─ danger-zone.tsx

apps/web/components/verify/
  └─ boot-sequence.tsx

apps/web/lib/testimonials.ts
apps/web/lib/use-typewriter.ts
apps/web/lib/use-scroll-progress.ts
```

**Modified files:**
```
apps/web/package.json                   # +geist
apps/web/app/globals.css                # tokens, scale, animation primitives
apps/web/app/layout.tsx                 # font wiring + global chrome
apps/web/app/page.tsx                   # landing shell only
apps/web/app/brief/[date]/page.tsx      # reader shell
apps/web/app/archive/page.tsx           # archive shell
apps/web/app/dashboard/page.tsx         # dashboard shell
apps/web/app/verify/page.tsx            # verify shell (unchanged, sub-component swaps)
apps/web/components/verify-client.tsx   # use BootSequence
apps/web/components/dashboard-client.tsx # use new dashboard panels (or replaced)
apps/web/components/email-signup.tsx    # restyled inline
apps/web/components/tab-switcher.tsx    # superseded by install-tabs; deleted at end
```

---

## Task 1: Design tokens, Geist font, animation primitives

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/layout.tsx`

This task wires the foundations — new design tokens, font, and global animation keyframes — without touching any page yet.

- [ ] **Step 1: Install Geist**

Run from repo root:

```bash
pnpm --filter @the-pull/web add geist
```

Expected: `geist` added under `dependencies` in `apps/web/package.json`.

- [ ] **Step 2: Extend globals.css with new tokens + scale + animation keyframes**

Replace the existing `apps/web/app/globals.css` with:

```css
@import "tailwindcss";

@theme {
  /* Catppuccin Mocha — palette tuned for both web and TUI parity */
  --color-base: #1e1e2e;
  --color-mantle: #181825;
  --color-crust: #11111b;
  --color-surface0: #313244;
  --color-surface1: #45475a;
  --color-surface2: #585b70;
  --color-overlay0: #6c7086;
  --color-overlay1: #7f849c;
  --color-overlay2: #9399b2;
  --color-subtext1: #bac2de;
  --color-subtext0: #a6adc8;
  --color-text: #cdd6f4;
  --color-lavender: #b4befe;
  --color-blue: #89b4fa;
  --color-sapphire: #74c7ec;
  --color-sky: #89dceb;
  --color-teal: #94e2d5;
  --color-green: #a6e3a1;
  --color-yellow: #f9e2af;
  --color-peach: #fab387;
  --color-maroon: #eba0ac;
  --color-red: #f38ba8;
  --color-mauve: #cba6f7;
  --color-pink: #f5c2e7;
  --color-flamingo: #f2cdcd;
  --color-rosewater: #f5e0dc;

  /* Redesign additions */
  --color-accent: var(--color-mauve);
  --color-prompt: var(--color-green);
  --color-rule: color-mix(in oklab, var(--color-surface1) 60%, transparent);
  --color-glow: color-mix(in oklab, var(--color-mauve) 25%, transparent);

  /* Widths */
  --w-prose: 38rem;
  --w-wide: 56rem;
  --w-grid: 72rem;

  /* Type scale (rem) */
  --text-micro: 0.6875rem;
  --text-caption: 0.8125rem;
  --text-body-sm: 0.9375rem;
  --text-body: 1.0625rem;
  --text-h3: 1.25rem;
  --text-h2: 1.625rem;
  --text-h1: 2.5rem;
  --text-display: 4rem;

  --font-mono:
    "JetBrains Mono", "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas,
    monospace;
  --font-sans:
    var(--font-geist-sans), "Inter var", "Inter", ui-sans-serif, system-ui,
    -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

html,
body {
  background: var(--color-base);
  color: var(--color-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "ss01", "cv11"; /* Geist stylistic alts when present */
}

a {
  color: var(--color-lavender);
  text-decoration: underline;
  text-decoration-color: color-mix(in oklab, var(--color-lavender) 40%, transparent);
  text-underline-offset: 3px;
}

a:hover {
  text-decoration-color: var(--color-lavender);
}

code,
pre,
kbd,
samp {
  font-family: var(--font-mono);
}

.brief-prose h2 {
  margin-top: 2rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.brief-prose p {
  margin: 0.75rem 0;
  line-height: 1.7;
  color: var(--color-subtext1);
  max-width: 60ch;
}

.brief-prose blockquote {
  border-left: 3px solid var(--color-mauve);
  padding-left: 0.75rem;
  margin: 0.75rem 0;
  color: var(--color-subtext0);
  font-style: italic;
}

.brief-prose ol,
.brief-prose ul {
  margin: 0.5rem 0 0.75rem 1.5rem;
  color: var(--color-subtext1);
}

.brief-prose hr {
  border: 0;
  border-top: 1px solid var(--color-rule);
  margin: 2rem 0;
}

/* Tabular figures for mono numerals (edition numbers, importance bars) */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}

/* Caret blink (used by prompt-line + terminal-pane) */
@keyframes caret-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.caret {
  display: inline-block;
  width: 0.55em;
  height: 1em;
  vertical-align: -0.12em;
  background: currentColor;
  animation: caret-blink 1s steps(1, end) infinite;
}

/* Subtle pulse for live indicator */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.9); }
}
.pulse-dot {
  animation: pulse-dot 2.4s ease-in-out infinite;
}

/* CRT scanline overlay (only active when html has class scanlines-on) */
.scanlines-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 80;
  opacity: 0;
  transition: opacity 200ms;
  background-image: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.03) 0,
    rgba(255, 255, 255, 0.03) 1px,
    transparent 1px,
    transparent 3px
  );
  mix-blend-mode: overlay;
}
html.scanlines-on .scanlines-overlay {
  opacity: 1;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .caret { animation: none; opacity: 1; }
  .pulse-dot { animation: none; }
}
```

- [ ] **Step 3: Wire Geist into the root layout**

Replace `apps/web/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Pull — The daily AI brief, delivered where you build",
  description:
    "A daily AI news brief for developers. Curated weekday mornings, delivered to your terminal, agent, inbox, or feed reader.",
  metadataBase: new URL("https://thepull.dev"),
  openGraph: {
    type: "website",
    title: "The Pull — The daily AI brief",
    description:
      "A daily AI news brief for developers. Delivered where you build.",
    url: "https://thepull.dev",
    siteName: "The Pull",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Pull",
    description: "The daily AI brief, delivered where you build.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.variable}>
      <body className="min-h-screen flex flex-col">
        <div className="scanlines-overlay" aria-hidden />
        {children}
      </body>
    </html>
  );
}
```

Note: site-header and site-footer get wired in Task 4. For now the layout adds the scanline overlay div and the font variable; nothing visual changes yet.

- [ ] **Step 4: Verify build**

Run:

```bash
pnpm --filter @the-pull/web typecheck
pnpm --filter @the-pull/web lint
```

Expected: both pass with no new errors.

Run dev server and confirm the existing landing page still renders (the visual changes are nearly invisible at this stage — only the tokens are different and Inter falls back to Geist):

```bash
pnpm --filter @the-pull/web dev
# open http://localhost:3000
```

Expected: page renders, no console errors, body text is now Geist (slightly different shape from Inter), no broken styling.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/app/globals.css apps/web/app/layout.tsx pnpm-lock.yaml
git commit -m "Frontend redesign: design tokens, Geist font, animation primitives"
```

---

## Task 2: Terminal primitives — atomic components

**Files:**
- Create: `apps/web/components/terminal/prompt-line.tsx`
- Create: `apps/web/components/terminal/ascii-rule.tsx`
- Create: `apps/web/components/terminal/meta-chip.tsx`
- Create: `apps/web/components/terminal/edition-number.tsx`
- Create: `apps/web/components/terminal/index.ts`

Small, side-effect-free presentation components. No state. Each component is single-responsibility.

- [ ] **Step 1: PromptLine**

Create `apps/web/components/terminal/prompt-line.tsx`:

```tsx
import { ReactNode } from "react";

interface Props {
  path?: string;
  caret?: boolean;
  className?: string;
  children?: ReactNode;
}

export function PromptLine({
  path = "~/the-pull",
  caret = false,
  className,
  children,
}: Props) {
  return (
    <span
      className={
        "inline-flex items-baseline gap-2 font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)] " +
        (className ?? "")
      }
    >
      <span className="text-[color:var(--color-mauve)]">{path}</span>
      <span className="text-[color:var(--color-prompt)]">$</span>
      {children && <span className="text-[color:var(--color-text)]">{children}</span>}
      {caret && <span className="caret bg-[color:var(--color-text)]" />}
    </span>
  );
}
```

- [ ] **Step 2: AsciiRule**

Create `apps/web/components/terminal/ascii-rule.tsx`:

```tsx
interface Props {
  label?: string;
  number?: string;
  className?: string;
}

export function AsciiRule({ label, number, className }: Props) {
  const text = label
    ? number
      ? `── ${number} · ${label} `
      : `── ${label} `
    : number
      ? `── ${number} `
      : "── ";
  return (
    <div
      className={
        "font-mono text-[color:var(--color-overlay1)] text-[var(--text-caption)] tracking-tight flex items-center gap-0 select-none " +
        (className ?? "")
      }
      aria-hidden
    >
      <span className="whitespace-pre">{text}</span>
      <span
        aria-hidden
        className="flex-1 h-px"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, var(--color-rule) 0 6px, transparent 6px 8px)",
          backgroundPosition: "left center",
          backgroundRepeat: "repeat-x",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: MetaChip**

Create `apps/web/components/terminal/meta-chip.tsx`:

```tsx
interface Props {
  label: string;
  /** Optional 0-1 importance (renders a ▓▓▓░░ bar). */
  bar?: number;
  variant?: "default" | "mauve" | "muted";
  className?: string;
}

const BAR_CELLS = 5;

function bar(value: number) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * BAR_CELLS);
  return "▓".repeat(filled) + "░".repeat(BAR_CELLS - filled);
}

export function MetaChip({ label, bar: b, variant = "default", className }: Props) {
  const palette =
    variant === "mauve"
      ? "bg-[color:color-mix(in_oklab,var(--color-mauve)_18%,transparent)] text-[color:var(--color-mauve)]"
      : variant === "muted"
        ? "bg-[color:var(--color-mantle)] text-[color:var(--color-overlay1)]"
        : "bg-[color:var(--color-surface0)] text-[color:var(--color-subtext0)]";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded font-mono text-[var(--text-micro)] uppercase tracking-wider tabular-nums " +
        palette +
        " " +
        (className ?? "")
      }
    >
      <span>{label}</span>
      {typeof b === "number" && (
        <span className="text-[color:var(--color-mauve)] tracking-tight">
          {bar(b)}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 4: EditionNumber**

Create `apps/web/components/terminal/edition-number.tsx`:

```tsx
interface Props {
  edition: number;
  size?: "display" | "h1" | "inline";
  className?: string;
}

export function EditionNumber({ edition, size = "h1", className }: Props) {
  const sizeClass =
    size === "display"
      ? "text-[var(--text-display)] leading-none"
      : size === "h1"
        ? "text-[var(--text-h1)] leading-none"
        : "text-[var(--text-body)]";
  return (
    <span
      className={
        "font-mono font-semibold tabular-nums tracking-tight text-[color:var(--color-mauve)] " +
        sizeClass +
        " " +
        (className ?? "")
      }
    >
      #{String(edition).padStart(3, "0")}
    </span>
  );
}
```

- [ ] **Step 5: Barrel export**

Create `apps/web/components/terminal/index.ts`:

```ts
export { PromptLine } from "./prompt-line";
export { AsciiRule } from "./ascii-rule";
export { MetaChip } from "./meta-chip";
export { EditionNumber } from "./edition-number";
export { BoxFrame } from "./box-frame";
export { TerminalPane } from "./terminal-pane";
export { StatusBar } from "./status-bar";
export { ScanlineToggle } from "./scanline-toggle";
```

Note: barrel references `BoxFrame`, `TerminalPane`, `StatusBar`, `ScanlineToggle` which are created in Task 3. Typecheck will fail until Task 3 — that's OK, we commit Task 2 only after Task 3 lands. **Therefore Task 2 and Task 3 commit together at the end of Task 3.**

- [ ] **Step 6: Sanity-check imports compile**

Skip typecheck/commit for this task — combine with Task 3.

---

## Task 3: Terminal primitives — frame components

**Files:**
- Create: `apps/web/components/terminal/box-frame.tsx`
- Create: `apps/web/components/terminal/terminal-pane.tsx`
- Create: `apps/web/components/terminal/status-bar.tsx`
- Create: `apps/web/components/terminal/scanline-overlay.tsx` (helper)
- Create: `apps/web/components/terminal/scanline-toggle.tsx`

The visual chrome — box drawings, terminal window frames, persistent status bar, scanline toggle.

- [ ] **Step 1: BoxFrame**

Create `apps/web/components/terminal/box-frame.tsx`:

```tsx
import { ReactNode } from "react";

interface Props {
  label?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "warn";
}

export function BoxFrame({ label, children, className, tone = "default" }: Props) {
  const border =
    tone === "accent"
      ? "border-[color:var(--color-mauve)]"
      : tone === "warn"
        ? "border-[color:var(--color-peach)]"
        : "border-[color:var(--color-rule)]";
  const labelColor =
    tone === "accent"
      ? "text-[color:var(--color-mauve)]"
      : tone === "warn"
        ? "text-[color:var(--color-peach)]"
        : "text-[color:var(--color-overlay1)]";
  return (
    <div
      className={
        "relative rounded-md border " +
        border +
        " bg-[color:color-mix(in_oklab,var(--color-mantle)_70%,transparent)] " +
        (className ?? "")
      }
    >
      {label && (
        <div
          className={
            "absolute -top-2.5 left-3 px-1.5 font-mono text-[var(--text-micro)] uppercase tracking-wider bg-[color:var(--color-base)] " +
            labelColor
          }
        >
          {label}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: TerminalPane**

Create `apps/web/components/terminal/terminal-pane.tsx`:

```tsx
import { ReactNode } from "react";

interface Props {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function TerminalPane({ title = "bash — the-pull", children, className }: Props) {
  return (
    <div
      className={
        "rounded-lg border border-[color:var(--color-surface1)] bg-[color:var(--color-mantle)] overflow-hidden shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)] " +
        (className ?? "")
      }
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[color:var(--color-surface1)] bg-[color:var(--color-crust)]">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[color:var(--color-red)] opacity-70" />
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[color:var(--color-yellow)] opacity-70" />
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[color:var(--color-green)] opacity-70" />
        <span className="ml-3 font-mono text-[var(--text-micro)] text-[color:var(--color-overlay1)]">
          {title}
        </span>
      </div>
      <div className="font-mono text-[var(--text-caption)] text-[color:var(--color-text)]">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: ScanlineToggle (client component, localStorage-driven)**

Create `apps/web/components/terminal/scanline-toggle.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

const KEY = "the-pull:scanlines";

export function ScanlineToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    const initial = stored === "1";
    setOn(initial);
    document.documentElement.classList.toggle("scanlines-on", initial);
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    document.documentElement.classList.toggle("scanlines-on", next);
    localStorage.setItem(KEY, next ? "1" : "0");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay1)] hover:text-[color:var(--color-mauve)] transition-colors"
      aria-pressed={on}
      aria-label="Toggle CRT scanlines"
    >
      [ crt: {on ? "on" : "off"} ]
    </button>
  );
}
```

- [ ] **Step 4: StatusBar**

Create `apps/web/components/terminal/status-bar.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  edition?: number;
  date?: string;
  path?: string;
}

const KEY = "the-pull:statusbar-dismissed";

export function StatusBar({ edition, date, path = "~/the-pull" }: Props) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash

  useEffect(() => {
    setDismissed(localStorage.getItem(KEY) === "1");
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(KEY, "1");
  }

  if (dismissed) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 backdrop-blur-md bg-[color:color-mix(in_oklab,var(--color-crust)_85%,transparent)] border-t border-[color:var(--color-surface1)]"
      role="contentinfo"
      aria-label="Site status"
    >
      <div className="max-w-[var(--w-grid)] mx-auto px-6 h-9 flex items-center gap-3 font-mono text-[var(--text-micro)] text-[color:var(--color-overlay2)]">
        <span className="text-[color:var(--color-mauve)]">{path}</span>
        <span>·</span>
        {typeof edition === "number" && (
          <>
            <span className="tabular-nums">ed.#{String(edition).padStart(3, "0")}</span>
            <span>·</span>
          </>
        )}
        {date && (
          <>
            <span>{date}</span>
            <span>·</span>
          </>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--color-prompt)] pulse-dot" />
          live
        </span>
        <span className="ml-auto flex items-center gap-3">
          <Link href="/#email" className="hover:text-[color:var(--color-mauve)]">
            ⏎ subscribe
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss status bar"
            className="hover:text-[color:var(--color-mauve)]"
          >
            ✕
          </button>
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify combined primitives compile**

Run:

```bash
pnpm --filter @the-pull/web typecheck
pnpm --filter @the-pull/web lint
```

Expected: both pass. The barrel export from Task 2 should now resolve.

- [ ] **Step 6: Commit (covers Tasks 2 + 3)**

```bash
git add apps/web/components/terminal/
git commit -m "Frontend redesign: terminal primitives (PromptLine, AsciiRule, MetaChip, EditionNumber, BoxFrame, TerminalPane, StatusBar, ScanlineToggle)"
```

---

## Task 4: Global site header + footer

**Files:**
- Create: `apps/web/components/chrome/site-header.tsx`
- Create: `apps/web/components/chrome/site-footer.tsx`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: SiteHeader**

Create `apps/web/components/chrome/site-header.tsx`:

```tsx
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-rule)] backdrop-blur-md bg-[color:color-mix(in_oklab,var(--color-base)_85%,transparent)]">
      <div className="max-w-[var(--w-grid)] mx-auto px-6 h-14 flex items-center gap-6">
        <Link
          href="/"
          className="font-mono text-[var(--text-body-sm)] text-[color:var(--color-text)] no-underline"
          aria-label="The Pull, home"
        >
          <span className="text-[color:var(--color-overlay1)]">[</span>
          <span className="px-1">the pull</span>
          <span className="text-[color:var(--color-overlay1)]">]</span>
        </Link>
        <nav className="ml-auto flex items-center gap-5 font-mono text-[var(--text-caption)]">
          <Link
            href="/archive"
            className="text-[color:var(--color-overlay1)] hover:text-[color:var(--color-mauve)] no-underline"
          >
            archive
          </Link>
          <Link
            href="/brief/latest"
            className="text-[color:var(--color-overlay1)] hover:text-[color:var(--color-mauve)] no-underline"
          >
            today
          </Link>
          <Link
            href="/#email"
            className="text-[color:var(--color-mauve)] no-underline"
          >
            subscribe
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: SiteFooter**

Create `apps/web/components/chrome/site-footer.tsx`:

```tsx
import Link from "next/link";
import { ScanlineToggle } from "@/components/terminal";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[color:var(--color-rule)]">
      <div className="max-w-[var(--w-grid)] mx-auto px-6 py-12 grid gap-10 md:grid-cols-3 text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
        <div>
          <div className="font-mono text-[color:var(--color-text)]">
            <span className="text-[color:var(--color-overlay1)]">[</span>
            <span className="px-1">the pull</span>
            <span className="text-[color:var(--color-overlay1)]">]</span>
          </div>
          <p className="mt-3 max-w-xs">
            The daily AI brief for developers. 7ish items, weekday mornings,
            delivered where you build.
          </p>
        </div>
        <div>
          <div className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay2)] mb-3">
            the brief
          </div>
          <ul className="space-y-2">
            <li><Link href="/brief/latest" className="no-underline hover:text-[color:var(--color-mauve)]">today</Link></li>
            <li><Link href="/archive" className="no-underline hover:text-[color:var(--color-mauve)]">archive</Link></li>
            <li><a href="/feed.xml" className="no-underline hover:text-[color:var(--color-mauve)]">rss</a></li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay2)] mb-3">
            the project
          </div>
          <ul className="space-y-2">
            <li><a href="https://github.com/joshferrara/the-pull" className="no-underline hover:text-[color:var(--color-mauve)]">github</a></li>
            <li><Link href="/dashboard" className="no-underline hover:text-[color:var(--color-mauve)]">account</Link></li>
            <li><ScanlineToggle /></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[color:var(--color-rule)]">
        <div className="max-w-[var(--w-grid)] mx-auto px-6 py-4 font-mono text-[var(--text-micro)] text-[color:var(--color-overlay0)] flex flex-wrap gap-x-4 gap-y-1">
          <span># ferrara, j. — 2026 · built with ☕ + claude</span>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Wire chrome into layout.tsx**

Replace `apps/web/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { SiteHeader } from "@/components/chrome/site-header";
import { SiteFooter } from "@/components/chrome/site-footer";

export const metadata: Metadata = {
  title: "The Pull — The daily AI brief, delivered where you build",
  description:
    "A daily AI news brief for developers. Curated weekday mornings, delivered to your terminal, agent, inbox, or feed reader.",
  metadataBase: new URL("https://thepull.dev"),
  openGraph: {
    type: "website",
    title: "The Pull — The daily AI brief",
    description:
      "A daily AI news brief for developers. Delivered where you build.",
    url: "https://thepull.dev",
    siteName: "The Pull",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Pull",
    description: "The daily AI brief, delivered where you build.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.variable}>
      <body className="min-h-screen flex flex-col">
        <div className="scanlines-overlay" aria-hidden />
        <SiteHeader />
        <main className="flex-1 flex flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

Note: existing pages use a `<main>` inside their `page.tsx`. The layout `<main>` wraps them. The existing inner `<main>` will become a section/article wrapper later (Task 5+). For now both render — that's a temporary minor HTML-validation warning, fixed as each page is reworked.

- [ ] **Step 4: Verify**

Run typecheck + lint. Run dev server. Confirm:
- Header strip with `[ the pull ]` and nav appears at top of every page.
- Footer with three columns appears at bottom.
- Scanline toggle in footer flips a class on `<html>` and the overlay tints visible.
- Existing landing/archive/brief content still renders below the header (some double-`<main>` is OK; resolved as pages are reworked).

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/chrome/ apps/web/app/layout.tsx
git commit -m "Frontend redesign: site header + footer with scanline toggle"
```

---

## Task 5: Landing — restructure shell + remove dead sections

**Files:**
- Modify: `apps/web/app/page.tsx`
- Create: `apps/web/lib/testimonials.ts`
- Create: `apps/web/components/landing/` (empty subcomponents — actual content in Tasks 6-9)

Restructure landing into a slim shell + delete the old testimonials/how-it-works sections (replaced in Tasks 6-9). This task is intentionally surgical — produces a landing page with header, footer, and the OLD hero (untouched) but with dead sections removed.

- [ ] **Step 1: Create testimonials config**

Create `apps/web/lib/testimonials.ts`:

```ts
export interface Testimonial {
  text: string;
  who: string;
  href?: string;
}

/**
 * Drives the "From the field" landing section. Empty array hides the section.
 * Repopulate when real quotes exist.
 */
export const TESTIMONIALS: Testimonial[] = [];
```

- [ ] **Step 2: Replace landing page.tsx with new shell**

Replace `apps/web/app/page.tsx` with:

```tsx
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { getBriefJson } from "@/lib/r2";
import { StatusBar } from "@/components/terminal";
import { Hero } from "@/components/landing/hero";
import { TodayTable } from "@/components/landing/today-table";
import { TheDeal } from "@/components/landing/the-deal";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";

export const dynamic = "force-dynamic";

async function getLatestPreview() {
  const latest = await convexClient().query(api.briefs.getLatestPublished);
  if (!latest) return null;
  const brief = await getBriefJson(latest.date);
  if (!brief) return null;
  return brief;
}

export default async function LandingPage() {
  const brief = await getLatestPreview();

  return (
    <>
      <Hero brief={brief} />
      <TodayTable brief={brief} />
      <TheDeal />
      <Faq />
      <FinalCta />
      <StatusBar edition={brief?.edition} date={brief?.date} path="~/the-pull" />
    </>
  );
}
```

Note: this file imports components created in Tasks 6-9. We need stubs so typecheck passes incrementally.

- [ ] **Step 3: Create stub components**

Create `apps/web/components/landing/hero.tsx`:

```tsx
import type { BriefV1 } from "@the-pull/schema";

interface Props { brief: BriefV1 | null }

export function Hero({ brief }: Props) {
  return <section className="px-6 py-12 text-[color:var(--color-overlay1)]">[hero placeholder · brief edition #{brief?.edition ?? "—"}]</section>;
}
```

Create `apps/web/components/landing/today-table.tsx`:

```tsx
import type { BriefV1 } from "@the-pull/schema";

interface Props { brief: BriefV1 | null }

export function TodayTable({ brief }: Props) {
  return <section className="px-6 py-12 text-[color:var(--color-overlay1)]">[today table placeholder · {brief?.items.length ?? 0} items]</section>;
}
```

Create `apps/web/components/landing/the-deal.tsx`:

```tsx
export function TheDeal() {
  return <section className="px-6 py-12 text-[color:var(--color-overlay1)]">[the deal placeholder]</section>;
}
```

Create `apps/web/components/landing/faq.tsx`:

```tsx
export function Faq() {
  return <section className="px-6 py-12 text-[color:var(--color-overlay1)]">[faq placeholder]</section>;
}
```

Create `apps/web/components/landing/final-cta.tsx`:

```tsx
export function FinalCta() {
  return <section className="px-6 py-12 text-[color:var(--color-overlay1)]">[final cta placeholder]</section>;
}
```

- [ ] **Step 4: Verify the type for `BriefV1` exists**

Run:

```bash
grep -n "export" /Users/joshferrara/Desktop/AI\ Projects/Personal/The\ Pull/packages/schema/types.ts | head -20
```

Expected: the schema types are exported. If the exported name differs (e.g. `Brief`, `BriefV1Body`), update the imports in all stubs above to match. Common alternate: `import type { Brief } from "@the-pull/schema"` and change the `BriefV1` references.

- [ ] **Step 5: Verify build**

Run typecheck + lint + dev server. Confirm:
- Landing page now shows five `[... placeholder]` lines stacked.
- Header + footer still render around them.
- No console errors.
- Status bar renders pinned at bottom (and is dismissable).

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/testimonials.ts apps/web/app/page.tsx apps/web/components/landing/
git commit -m "Frontend redesign: landing shell with section placeholders"
```

---

## Task 6: Landing — Hero (left column, value prop + install tabs)

**Files:**
- Create: `apps/web/components/landing/install-tabs.tsx`
- Modify: `apps/web/components/landing/hero.tsx`
- Modify: `apps/web/components/email-signup.tsx`

The left half of the hero — eyebrow + headline + sub + install tabs + email signup hook.

- [ ] **Step 1: Build InstallTabs (replaces TabSwitcher for landing usage)**

Create `apps/web/components/landing/install-tabs.tsx`:

```tsx
"use client";

import { useState } from "react";
import { TerminalPane } from "@/components/terminal";

const TERMINAL = `curl -fsSL https://thepull.dev/install | sh
pull login`;

const AGENT = `Set up a daily AI brief for me:
1. Register at https://thepull.dev/api/v1/auth/register with my email
2. I'll click the verification link and provide you my token
3. Save the token to ~/.config/the-pull/agent-token
4. Add a cron job that fetches https://thepull.dev/api/v1/today.json
   with the token each morning at 8am and summarizes it for me`;

type Tab = "terminal" | "agent" | "email";

export function InstallTabs({ onChooseEmail }: { onChooseEmail: () => void }) {
  const [tab, setTab] = useState<Tab>("terminal");
  const snippet = tab === "terminal" ? TERMINAL : tab === "agent" ? AGENT : null;
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div>
      <div className="flex gap-1 mb-3 font-mono text-[var(--text-caption)]">
        <TabBtn active={tab === "terminal"} onClick={() => setTab("terminal")}>terminal</TabBtn>
        <TabBtn active={tab === "agent"} onClick={() => setTab("agent")}>agent</TabBtn>
        <TabBtn active={tab === "email"} onClick={() => { setTab("email"); onChooseEmail(); }}>email</TabBtn>
      </div>
      {snippet ? (
        <TerminalPane title={tab === "terminal" ? "bash — install" : "agent — instructions"}>
          <pre className="p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">
            <code>{snippet}</code>
          </pre>
          <div className="border-t border-[color:var(--color-surface1)] px-4 py-2 flex items-center justify-between text-[var(--text-micro)] text-[color:var(--color-overlay1)]">
            <span>{copied ? "✓ copied" : "ready"}</span>
            <button
              type="button"
              onClick={copy}
              className="hover:text-[color:var(--color-mauve)]"
            >
              ⌘C copy
            </button>
          </div>
        </TerminalPane>
      ) : (
        <p className="text-[color:var(--color-overlay1)] font-mono text-[var(--text-caption)]">
          ↓ enter your email below.
        </p>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-2.5 py-1 rounded-md font-mono text-[var(--text-caption)] transition-colors " +
        (active
          ? "bg-[color:var(--color-surface0)] text-[color:var(--color-text)]"
          : "text-[color:var(--color-overlay1)] hover:text-[color:var(--color-text)]")
      }
    >
      <span className={active ? "text-[color:var(--color-overlay1)]" : "opacity-0"}>[</span>
      {children}
      <span className={active ? "text-[color:var(--color-overlay1)]" : "opacity-0"}>]</span>
    </button>
  );
}
```

- [ ] **Step 2: Restyle email signup**

Replace `apps/web/components/email-signup.tsx` with:

```tsx
"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

export function EmailSignup({ id = "email" }: { id?: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "loading" });
    try {
      const resp = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "landing" }),
      });
      if (!resp.ok) {
        const data = (await resp.json().catch(() => ({}))) as { error?: string };
        setState({ kind: "error", message: data.error ?? `error_${resp.status}` });
        return;
      }
      setState({ kind: "ok" });
    } catch {
      setState({ kind: "error", message: "network" });
    }
  }

  if (state.kind === "ok") {
    return (
      <div id={id} className="font-mono text-[var(--text-caption)] text-[color:var(--color-prompt)] flex items-center gap-2">
        <span>✓</span>
        <span>magic link sent to</span>
        <span className="text-[color:var(--color-text)]">{email}</span>
      </div>
    );
  }

  return (
    <form id={id} onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
      <input
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-3 py-2 rounded-md bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] text-[color:var(--color-text)] placeholder:text-[color:var(--color-overlay0)] focus:outline-none focus:border-[color:var(--color-mauve)] font-mono text-[var(--text-body-sm)]"
      />
      <button
        type="submit"
        disabled={state.kind === "loading"}
        className="px-4 py-2 rounded-md bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {state.kind === "loading" ? "sending…" : "get the brief"}
      </button>
      {state.kind === "error" && (
        <p className="text-[color:var(--color-red)] text-[var(--text-micro)] mt-1 sm:mt-0 font-mono">
          {state.message}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Replace Hero with the full implementation (left column only — right column comes in Task 7)**

Replace `apps/web/components/landing/hero.tsx` with:

```tsx
"use client";

import { useState } from "react";
import type { BriefV1 } from "@the-pull/schema";
import { PromptLine } from "@/components/terminal";
import { InstallTabs } from "./install-tabs";
import { EmailSignup } from "@/components/email-signup";
import { LivePreviewPane } from "./live-preview-pane";

interface Props {
  brief: BriefV1 | null;
}

export function Hero({ brief }: Props) {
  const [emailOpen, setEmailOpen] = useState(false);

  return (
    <section className="max-w-[var(--w-grid)] mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-start">
      <div>
        <PromptLine path="~/the-pull">today --preview</PromptLine>
        <h1 className="mt-5 text-[var(--text-h1)] md:text-[var(--text-display)] leading-[1.05] font-semibold tracking-tight text-[color:var(--color-text)]">
          The daily AI brief,
          <br />
          <span className="text-[color:var(--color-mauve)]">delivered where you build.</span>
        </h1>
        <p className="mt-6 text-[var(--text-body)] text-[color:var(--color-subtext1)] max-w-md">
          For developers who can&apos;t keep up with AI but need to. 7ish items,
          weekday mornings, in your terminal, agent, inbox, or feed reader.
        </p>

        <div className="mt-10">
          <InstallTabs onChooseEmail={() => setEmailOpen(true)} />
        </div>

        <div className={"mt-6 max-w-md " + (emailOpen ? "block" : "hidden")}>
          <EmailSignup />
        </div>

        <div className="mt-6 text-[var(--text-caption)] text-[color:var(--color-overlay1)] font-mono">
          {!emailOpen && (
            <>
              or get it{" "}
              <button
                type="button"
                onClick={() => setEmailOpen(true)}
                className="underline underline-offset-2 text-[color:var(--color-mauve)]"
              >
                in your inbox
              </button>
              .
            </>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-20">
        <LivePreviewPane brief={brief} />
      </div>
    </section>
  );
}
```

This references `LivePreviewPane` which we stub now and fill in Task 7. Add a stub:

Create `apps/web/components/landing/live-preview-pane.tsx`:

```tsx
import type { BriefV1 } from "@the-pull/schema";

interface Props { brief: BriefV1 | null }

export function LivePreviewPane({ brief }: Props) {
  return (
    <div className="rounded-lg border border-[color:var(--color-rule)] p-6 font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
      [live preview placeholder · {brief ? `ed.#${brief.edition}` : "no brief"}]
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run typecheck + lint + dev. Confirm:
- Landing hero renders with `~/the-pull $ today --preview` eyebrow.
- Headline reads with mauve second line.
- Tabs work, copy button works, "email" tab reveals the email signup.
- Right column shows the placeholder pane.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/landing/ apps/web/components/email-signup.tsx
git commit -m "Frontend redesign: landing hero with install tabs + email signup"
```

---

## Task 7: Landing — Live preview terminal pane (typewriter animation)

**Files:**
- Create: `apps/web/lib/use-typewriter.ts`
- Modify: `apps/web/components/landing/live-preview-pane.tsx`

The signature animation on the landing right column — typewriter terminal output rendering live brief data.

- [ ] **Step 1: useTypewriter hook**

Create `apps/web/lib/use-typewriter.ts`:

```ts
"use client";

import { useEffect, useState } from "react";

/**
 * Type-on animation. Returns the visible substring + a "done" flag.
 * Respects prefers-reduced-motion (instantly returns full string).
 */
export function useTypewriter(text: string, msPerChar = 18, startDelay = 0) {
  const [visible, setVisible] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(text);
      setDone(true);
      return;
    }
    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setVisible(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        return;
      }
      setTimeout(tick, msPerChar);
    };
    const id = setTimeout(tick, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [text, msPerChar, startDelay]);

  return { visible, done };
}
```

- [ ] **Step 2: LivePreviewPane full implementation**

Replace `apps/web/components/landing/live-preview-pane.tsx` with:

```tsx
"use client";

import type { BriefV1 } from "@the-pull/schema";
import { TerminalPane, MetaChip } from "@/components/terminal";
import { useTypewriter } from "@/lib/use-typewriter";
import { useEffect, useState } from "react";

interface Props {
  brief: BriefV1 | null;
}

const COMMAND = "curl -s https://thepull.dev/api/v1/today.json | jq";

export function LivePreviewPane({ brief }: Props) {
  const { visible: typed, done } = useTypewriter(COMMAND, 22, 250);
  const [revealedCount, setRevealedCount] = useState(0);
  const itemCount = brief?.items.length ?? 0;

  useEffect(() => {
    if (!done) return;
    if (!brief) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRevealedCount(itemCount);
      return;
    }
    let i = 0;
    const tick = () => {
      i += 1;
      setRevealedCount(i);
      if (i < itemCount) setTimeout(tick, 180);
    };
    const id = setTimeout(tick, 200);
    return () => clearTimeout(id);
  }, [done, brief, itemCount]);

  return (
    <TerminalPane title="bash — preview">
      <div className="p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[color:var(--color-prompt)]">$</span>
          <span className="text-[color:var(--color-text)]">{typed}</span>
          {!done && <span className="caret bg-[color:var(--color-text)]" />}
        </div>

        {done && brief && (
          <div className="mt-3 space-y-1">
            <Row index={-1} revealed>
              <span className="text-[color:var(--color-overlay1)]">{`{`}</span>
            </Row>
            <Row index={-1} revealed indent>
              <span className="text-[color:var(--color-blue)]">&quot;edition&quot;</span>
              <span className="text-[color:var(--color-overlay1)]">: </span>
              <span className="text-[color:var(--color-mauve)] tabular-nums">{brief.edition}</span>
              <span className="text-[color:var(--color-overlay1)]">,</span>
            </Row>
            <Row index={-1} revealed indent>
              <span className="text-[color:var(--color-blue)]">&quot;date&quot;</span>
              <span className="text-[color:var(--color-overlay1)]">: </span>
              <span className="text-[color:var(--color-green)]">&quot;{brief.date}&quot;</span>
              <span className="text-[color:var(--color-overlay1)]">,</span>
            </Row>
            <Row index={-1} revealed indent>
              <span className="text-[color:var(--color-blue)]">&quot;items&quot;</span>
              <span className="text-[color:var(--color-overlay1)]">: [</span>
            </Row>
            {brief.items.map((item, i) => (
              <Row key={item.id} index={i} revealed={i < revealedCount} indent>
                <span className="text-[color:var(--color-overlay1)] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[color:var(--color-overlay1)]"> · </span>
                <MetaChip label={item.category} />
                <span className="ml-1.5 text-[color:var(--color-text)] truncate">
                  {item.title}
                </span>
              </Row>
            ))}
            <Row index={-1} revealed indent>
              <span className="text-[color:var(--color-overlay1)]">]</span>
            </Row>
            <Row index={-1} revealed>
              <span className="text-[color:var(--color-overlay1)]">{`}`}</span>
            </Row>
          </div>
        )}

        {done && !brief && (
          <p className="mt-3 text-[color:var(--color-overlay1)]">
            no editions yet · check back monday.
          </p>
        )}

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[color:var(--color-prompt)]">$</span>
          <span className="caret bg-[color:var(--color-text)]" />
        </div>
      </div>
    </TerminalPane>
  );
}

function Row({
  revealed,
  indent,
  children,
}: {
  index: number;
  revealed: boolean;
  indent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "flex items-center gap-1 transition-all duration-200 ease-out " +
        (revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1") +
        " " +
        (indent ? "pl-3" : "")
      }
      aria-hidden={!revealed}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run dev. Confirm:
- Top of the pane types in `curl -s https://thepull.dev/api/v1/today.json | jq`.
- Once done, JSON-like preview reveals: `edition`, `date`, then items one by one with category chips.
- Caret blinks on bottom prompt.
- With reduce-motion enabled, everything appears instantly.

Typecheck + lint must pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/use-typewriter.ts apps/web/components/landing/live-preview-pane.tsx
git commit -m "Frontend redesign: live preview terminal pane with typewriter"
```

---

## Task 8: Landing — Today table with visual teaser gate

**Files:**
- Modify: `apps/web/components/landing/today-table.tsx`

Replaces the existing "Today's preview" list with the mono grid table + gradient-fade teaser.

- [ ] **Step 1: Implement TodayTable**

Replace `apps/web/components/landing/today-table.tsx` with:

```tsx
import Link from "next/link";
import type { BriefV1 } from "@the-pull/schema";
import { AsciiRule, MetaChip } from "@/components/terminal";

interface Props {
  brief: BriefV1 | null;
}

const FREE_ROWS = 4;

function importanceToBar(value: string): number {
  switch (value) {
    case "high":
      return 1.0;
    case "med":
    case "medium":
      return 0.6;
    case "low":
      return 0.3;
    default:
      return 0.5;
  }
}

export function TodayTable({ brief }: Props) {
  return (
    <section className="max-w-[var(--w-grid)] mx-auto px-6 pb-20">
      <AsciiRule label="today's brief" number="01" />
      <div className="mt-6">
        {brief ? (
          <>
            <p className="font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)] mb-4">
              edition #{String(brief.edition).padStart(3, "0")} · {brief.date} ·{" "}
              {brief.items.length} items
            </p>
            <div className="rounded-lg border border-[color:var(--color-rule)] overflow-hidden">
              <div className="grid grid-cols-[3rem_8rem_8rem_1fr] gap-x-4 px-4 py-2 border-b border-[color:var(--color-rule)] bg-[color:var(--color-mantle)] font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay1)]">
                <span>#</span>
                <span>category</span>
                <span>importance</span>
                <span>title</span>
              </div>
              <ul>
                {brief.items.map((item, i) => {
                  const gated = i >= FREE_ROWS;
                  return (
                    <li
                      key={item.id}
                      className={
                        "grid grid-cols-[3rem_8rem_8rem_1fr] gap-x-4 px-4 py-2.5 items-center border-b border-[color:var(--color-rule)] last:border-b-0 " +
                        (gated ? "relative" : "")
                      }
                      style={
                        gated
                          ? {
                              maskImage:
                                "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.15))",
                              WebkitMaskImage:
                                "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.15))",
                            }
                          : undefined
                      }
                    >
                      <span className="font-mono text-[var(--text-caption)] tabular-nums text-[color:var(--color-overlay1)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <MetaChip label={item.category} />
                      <MetaChip label={item.importance} bar={importanceToBar(item.importance)} />
                      <span className="text-[var(--text-body-sm)] text-[color:var(--color-text)] truncate">
                        {item.title}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {brief.items.length > FREE_ROWS && (
                <div className="px-4 py-4 bg-[color:color-mix(in_oklab,var(--color-mauve)_8%,transparent)] border-t border-[color:var(--color-rule)] flex items-center justify-between gap-4">
                  <span className="font-mono text-[var(--text-caption)] text-[color:var(--color-subtext1)]">
                    + {brief.items.length - FREE_ROWS} more — subscribe to read.
                  </span>
                  <Link
                    href="#email"
                    className="px-3 py-1.5 rounded-md bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium text-[var(--text-caption)] no-underline hover:opacity-90"
                  >
                    subscribe →
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
            no editions yet · first one is on the way.
          </p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run dev. Confirm:
- Section header reads `── 01 · today's brief ──`.
- Mono table renders with 4 columns.
- First 4 rows are crisp; rows beyond fade to ~15% opacity.
- "+ N more — subscribe" CTA strip below the rows.
- Importance chip shows `▓▓▓░░` bar.

Typecheck + lint pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/landing/today-table.tsx
git commit -m "Frontend redesign: today table with visual teaser gate"
```

---

## Task 9: Landing — TheDeal, FAQ, FinalCTA + delete old assets

**Files:**
- Modify: `apps/web/components/landing/the-deal.tsx`
- Modify: `apps/web/components/landing/faq.tsx`
- Modify: `apps/web/components/landing/final-cta.tsx`
- Delete: `apps/web/components/tab-switcher.tsx` (superseded by install-tabs)

- [ ] **Step 1: Implement TheDeal**

Replace `apps/web/components/landing/the-deal.tsx` with:

```tsx
import { AsciiRule } from "@/components/terminal";

const DEAL = [
  {
    head: "I read the web so you don't have to",
    body: "Every weekday I scour Twitter, GitHub, Hacker News, papers, and dev blogs for the AI news that actually matters to people who ship code.",
  },
  {
    head: "7ish items. Yesterday's signal.",
    body: "Not a feed. Not a daily roundup of everything. The handful of things that moved the needle for AI-adjacent builders in the last 24 hours.",
  },
  {
    head: "Read it where you already are",
    body: "Terminal, agent, inbox, or feed reader. One brief, four channels, six AM ET.",
  },
];

export function TheDeal() {
  return (
    <section className="max-w-[var(--w-grid)] mx-auto px-6 pb-20">
      <AsciiRule label="the deal" number="02" />
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {DEAL.map((d) => (
          <div key={d.head}>
            <h3 className="font-mono text-[var(--text-body-sm)] text-[color:var(--color-text)]">
              <span className="text-[color:var(--color-overlay1)]">[ </span>
              {d.head}
              <span className="text-[color:var(--color-overlay1)]"> ]</span>
            </h3>
            <p className="mt-3 text-[var(--text-body-sm)] text-[color:var(--color-subtext1)] leading-relaxed">
              {d.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implement FAQ**

Replace `apps/web/components/landing/faq.tsx` with:

```tsx
import { AsciiRule, MetaChip } from "@/components/terminal";

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "What if I already follow AI news?",
    a: "If you can confidently say you saw every important release, paper, and tool in the last week — you don't need this. If you can't, that's exactly what The Pull is for. 7ish items, curated, no scroll required.",
  },
  {
    q: "What's in it?",
    a: (
      <>
        Items are tagged by category — a typical week covers{" "}
        <MetaChip label="models" />{" "}
        <MetaChip label="tooling" />{" "}
        <MetaChip label="research" />{" "}
        <MetaChip label="products" />{" "}
        — plus the odd thing that doesn&apos;t fit a box.
      </>
    ),
  },
  {
    q: "Pricing?",
    a: "Free while I figure out what's worth charging for. A paid tier may show up later for richer formats, but the daily brief itself stays free.",
  },
];

export function Faq() {
  return (
    <section className="max-w-[var(--w-grid)] mx-auto px-6 pb-20">
      <AsciiRule label="faq" number="03" />
      <div className="mt-6 divide-y divide-[color:var(--color-rule)] max-w-[var(--w-wide)]">
        {FAQ.map((f) => (
          <details
            key={f.q}
            className="group py-4"
          >
            <summary className="cursor-pointer list-none flex items-baseline gap-3 font-mono text-[var(--text-body-sm)] text-[color:var(--color-text)]">
              <span className="text-[color:var(--color-mauve)]">Q.</span>
              <span className="flex-1">{f.q}</span>
              <span className="text-[color:var(--color-overlay1)] transition-transform group-open:rotate-90">▸</span>
            </summary>
            <div className="mt-3 ml-8 text-[var(--text-body-sm)] text-[color:var(--color-subtext1)] leading-relaxed">
              {f.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Implement FinalCTA**

Replace `apps/web/components/landing/final-cta.tsx` with:

```tsx
import { AsciiRule, TerminalPane } from "@/components/terminal";
import { EmailSignup } from "@/components/email-signup";

export function FinalCta() {
  return (
    <section className="max-w-[var(--w-grid)] mx-auto px-6 pb-32">
      <AsciiRule label="join" number="04" />
      <div className="mt-8 max-w-[var(--w-wide)]">
        <TerminalPane title="bash — subscribe">
          <div className="p-5">
            <p className="text-[color:var(--color-overlay1)] mb-1">
              <span className="text-[color:var(--color-prompt)]">$</span>{" "}
              <span className="text-[color:var(--color-text)]">subscribe</span>
            </p>
            <div className="mt-3" id="email">
              <EmailSignup />
            </div>
          </div>
        </TerminalPane>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Delete the old tab-switcher**

```bash
rm "/Users/joshferrara/Desktop/AI Projects/Personal/The Pull/apps/web/components/tab-switcher.tsx"
```

Verify nothing else imports it:

```bash
grep -r "tab-switcher" "/Users/joshferrara/Desktop/AI Projects/Personal/The Pull/apps/web"
```

Expected: zero matches.

- [ ] **Step 5: Verify**

Run typecheck + lint + dev. Confirm:
- Landing page now renders fully: header → hero → today table → the deal → faq → final cta → footer.
- All section dividers show as `── NN · label ──` rules.
- FAQ details expand/collapse with rotating chevron.
- Final CTA renders a TerminalPane wrapping the email signup.
- Status bar pinned at bottom (dismissable).

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/landing/the-deal.tsx apps/web/components/landing/faq.tsx apps/web/components/landing/final-cta.tsx
git rm apps/web/components/tab-switcher.tsx
git commit -m "Frontend redesign: the deal, FAQ, final CTA; remove old tab-switcher"
```

---

## Task 10: Brief reader — header, items, links sub-table

**Files:**
- Create: `apps/web/components/brief/brief-header.tsx`
- Create: `apps/web/components/brief/brief-item.tsx`
- Modify: `apps/web/app/brief/[date]/page.tsx`

- [ ] **Step 1: BriefHeader**

Create `apps/web/components/brief/brief-header.tsx`:

```tsx
import { BoxFrame, EditionNumber, PromptLine } from "@/components/terminal";

interface Props {
  edition: number;
  date: string;
  itemCount: number;
  publishedAt?: string;
  editorNote?: string;
}

function formatDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function BriefHeader({ edition, date, itemCount, publishedAt = "06:00 ET", editorNote }: Props) {
  return (
    <header className="mb-12">
      <PromptLine path={`~/brief/${date}`}>cat</PromptLine>
      <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4">
        <EditionNumber edition={edition} size="display" />
        <div>
          <h1 className="text-[var(--text-h2)] font-semibold text-[color:var(--color-text)] leading-tight">
            {formatDate(date)}
          </h1>
          <p className="mt-1 font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
            {itemCount} items · published {publishedAt} · press <kbd className="text-[color:var(--color-text)]">?</kbd> for shortcuts
          </p>
        </div>
      </div>
      {editorNote && (
        <div className="mt-8 max-w-[var(--w-prose)]">
          <BoxFrame label="editor note" tone="accent">
            <p className="italic text-[color:var(--color-subtext1)]">{editorNote}</p>
          </BoxFrame>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: BriefItem**

Create `apps/web/components/brief/brief-item.tsx`:

```tsx
import type { BriefItemV1 } from "@the-pull/schema";
import { AsciiRule, MetaChip } from "@/components/terminal";

interface Props {
  item: BriefItemV1;
  index: number;
  isLast: boolean;
  isPreview: boolean;
}

function importanceToBar(value: string): number {
  switch (value) {
    case "high":
      return 1.0;
    case "med":
    case "medium":
      return 0.6;
    case "low":
      return 0.3;
    default:
      return 0.5;
  }
}

function readMinutes(item: BriefItemV1): number {
  const text =
    ("summary" in item ? item.summary ?? "" : "") +
    ("commentary" in item ? item.commentary ?? "" : "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function BriefItem({ item, index, isLast, isPreview }: Props) {
  const minutes = !isPreview ? readMinutes(item) : null;
  return (
    <li id={`item-${index + 1}`} className="brief-prose scroll-mt-24">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <MetaChip label={item.category} />
        <MetaChip label={item.importance} bar={importanceToBar(item.importance)} />
        {minutes && (
          <span className="ml-auto font-mono text-[var(--text-micro)] text-[color:var(--color-overlay1)]">
            {minutes} min read
          </span>
        )}
      </div>
      <h2 className="text-[var(--text-h2)] font-semibold text-[color:var(--color-text)] leading-snug">
        {item.title}
      </h2>
      {!isPreview && "summary" in item && item.summary && (
        <p>{item.summary}</p>
      )}
      {!isPreview && "commentary" in item && item.commentary && (
        <blockquote>{item.commentary}</blockquote>
      )}
      {!isPreview && "links" in item && item.links && item.links.length > 0 && (
        <div className="mt-5">
          <div className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay1)] mb-2">
            sources
          </div>
          <ul className="font-mono text-[var(--text-caption)]">
            {item.links.map((link) => (
              <li key={link.url} className="flex items-baseline gap-3 py-1">
                <span className="text-[color:var(--color-overlay0)]">─</span>
                <span className="text-[color:var(--color-overlay1)] w-16">{link.type}</span>
                <a
                  href={link.url}
                  className="text-[color:var(--color-mauve)] hover:text-[color:var(--color-lavender)] truncate"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!isLast && (
        <AsciiRule
          number={String(index + 2).padStart(2, "0")}
          className="mt-10"
        />
      )}
    </li>
  );
}
```

Note on imports — `BriefItemV1` may be named differently in `packages/schema`. If typecheck complains, check `packages/schema/types.ts` and use the actual exported name (likely `Item` or `BriefV1Item`). The same applies elsewhere any `BriefItemV1` is referenced.

- [ ] **Step 3: Update brief page to use new header + item**

Replace `apps/web/app/brief/[date]/page.tsx` with:

```tsx
import { notFound } from "next/navigation";
import { getBriefJson } from "@/lib/r2";
import { verifyWebToken } from "@/lib/auth";
import { isPreview, toPreview } from "@the-pull/schema";
import type { Metadata } from "next";
import { StatusBar } from "@/components/terminal";
import { BriefHeader } from "@/components/brief/brief-header";
import { BriefItem } from "@/components/brief/brief-item";
import { PreviewGate } from "@/components/brief/preview-gate";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ t?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const brief = await getBriefJson(date);
  if (!brief) return { title: "The Pull" };
  const site = process.env.SITE_URL ?? "https://thepull.dev";
  const ogImage = `${site}/brief/${brief.date}/og.svg`;
  return {
    title: `The Pull — Edition #${brief.edition} (${brief.date})`,
    description: brief.editor_note,
    openGraph: {
      title: `The Pull — Edition #${brief.edition}`,
      description: brief.editor_note,
      url: `${site}/brief/${brief.date}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `The Pull — Edition #${brief.edition}`,
      description: brief.editor_note,
      images: [ogImage],
    },
  };
}

const FREE_ITEMS = 3;

export default async function BriefPage({ params, searchParams }: PageProps) {
  const { date } = await params;
  const { t: signedToken } = await searchParams;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const brief = await getBriefJson(date);
  if (!brief) notFound();

  let unlocked = false;
  if (signedToken) {
    const verified = await verifyWebToken(signedToken);
    if (verified && verified.briefDate === date) unlocked = true;
  }

  const display = unlocked ? brief : toPreview(brief);
  const preview = isPreview(display);

  return (
    <article className="max-w-[var(--w-prose)] mx-auto px-6 py-12">
      <BriefHeader
        edition={display.edition}
        date={display.date}
        itemCount={display.items.length}
        editorNote={!preview ? display.editor_note : undefined}
      />

      <ol className="space-y-12 list-none p-0">
        {display.items.map((item, i) => {
          const gated = preview && i >= FREE_ITEMS;
          return (
            <BriefItem
              key={item.id}
              item={item}
              index={i}
              isLast={i === display.items.length - 1}
              isPreview={gated}
            />
          );
        })}
      </ol>

      {preview && <PreviewGate remaining={Math.max(0, display.items.length - FREE_ITEMS)} />}

      <footer className="mt-20 pt-6 border-t border-[color:var(--color-rule)] font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
        Get this in your terminal:{" "}
        <code className="text-[color:var(--color-text)]">
          curl -fsSL https://thepull.dev/install | sh
        </code>
      </footer>

      <StatusBar edition={display.edition} date={display.date} path={`~/brief/${display.date}`} />
    </article>
  );
}
```

- [ ] **Step 4: Stub PreviewGate so typecheck passes**

Create `apps/web/components/brief/preview-gate.tsx`:

```tsx
interface Props { remaining: number }

export function PreviewGate({ remaining }: Props) {
  return <div className="mt-12 text-[color:var(--color-overlay1)] font-mono text-[var(--text-caption)]">[preview gate placeholder · {remaining} items locked]</div>;
}
```

(Full gate built in Task 12.)

- [ ] **Step 5: Verify**

Run typecheck + lint + dev. Visit `/brief/latest` or a known published date. Confirm:
- Edition number renders huge in mauve mono.
- Date renders large sans below.
- Editor note in `<BoxFrame>` with label.
- Items render with category + importance + bar chips, links as sources sub-table.
- Items separated by ASCII rules embedding the next item's number.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/brief/ apps/web/app/brief/[date]/page.tsx
git commit -m "Frontend redesign: brief header, items, links sub-table"
```

---

## Task 11: Brief reader — anchor rail, progress bar, keyboard shortcuts

**Files:**
- Create: `apps/web/lib/use-scroll-progress.ts`
- Create: `apps/web/components/brief/progress-bar.tsx`
- Create: `apps/web/components/brief/anchor-rail.tsx`
- Create: `apps/web/components/brief/keyboard-shortcuts.tsx`
- Modify: `apps/web/app/brief/[date]/page.tsx`

- [ ] **Step 1: useScrollProgress hook**

Create `apps/web/lib/use-scroll-progress.ts`:

```ts
"use client";

import { useEffect, useState } from "react";

/** Returns scroll progress 0-1 of the document. */
export function useScrollProgress(): number {
  const [p, setP] = useState(0);

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) {
        setP(1);
        return;
      }
      setP(Math.max(0, Math.min(1, window.scrollY / max)));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return p;
}
```

- [ ] **Step 2: ProgressBar**

Create `apps/web/components/brief/progress-bar.tsx`:

```tsx
"use client";

import { useScrollProgress } from "@/lib/use-scroll-progress";

export function ProgressBar() {
  const p = useScrollProgress();
  return (
    <div
      className="fixed inset-x-0 top-14 z-20 h-px bg-[color:var(--color-rule)]"
      aria-hidden
    >
      <div
        className="h-full bg-[color:var(--color-mauve)] transition-[width] duration-75 ease-out"
        style={{ width: `${(p * 100).toFixed(1)}%` }}
      />
    </div>
  );
}
```

- [ ] **Step 3: AnchorRail**

Create `apps/web/components/brief/anchor-rail.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface Props {
  count: number;
}

export function AnchorRail({ count }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ids = Array.from({ length: count }, (_, i) => `item-${i + 1}`);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = els.indexOf(e.target as HTMLElement);
            if (idx >= 0) setActive(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [count]);

  return (
    <aside
      className="hidden xl:flex flex-col gap-2 fixed left-[max(1.5rem,calc(50vw-var(--w-prose)/2-7rem))] top-32 font-mono text-[var(--text-caption)] tabular-nums z-10"
      aria-label="Items"
    >
      {Array.from({ length: count }, (_, i) => (
        <a
          key={i}
          href={`#item-${i + 1}`}
          className={
            "no-underline transition-colors " +
            (i === active
              ? "text-[color:var(--color-mauve)]"
              : "text-[color:var(--color-overlay0)] hover:text-[color:var(--color-overlay2)]")
          }
        >
          {String(i + 1).padStart(2, "0")}
        </a>
      ))}
    </aside>
  );
}
```

- [ ] **Step 4: KeyboardShortcuts**

Create `apps/web/components/brief/keyboard-shortcuts.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { BoxFrame } from "@/components/terminal";

interface Props {
  count: number;
}

export function KeyboardShortcuts({ count }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "g") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (e.key === "G") {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
        return;
      }
      if (e.key === "j" || e.key === "k") {
        const dir = e.key === "j" ? 1 : -1;
        const current = currentItem(count);
        const next = Math.max(0, Math.min(count - 1, current + dir));
        const el = document.getElementById(`item-${next + 1}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-[color:color-mix(in_oklab,var(--color-crust)_75%,transparent)] flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <BoxFrame label="keyboard">
          <ul className="font-mono text-[var(--text-body-sm)] space-y-1.5 text-[color:var(--color-subtext1)]">
            <Row k="j / k" v="next / prev item" />
            <Row k="g / G" v="top / bottom" />
            <Row k="?" v="toggle this help" />
            <Row k="esc" v="close" />
          </ul>
        </BoxFrame>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-baseline gap-4">
      <kbd className="px-1.5 py-0.5 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] text-[color:var(--color-text)]">
        {k}
      </kbd>
      <span>{v}</span>
    </li>
  );
}

function currentItem(count: number): number {
  for (let i = 0; i < count; i++) {
    const el = document.getElementById(`item-${i + 1}`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom > 200) return i;
  }
  return count - 1;
}
```

- [ ] **Step 5: Wire into brief page**

Edit `apps/web/app/brief/[date]/page.tsx` to add the new components — find the `return ( <article ...` block and update to:

```tsx
import { ProgressBar } from "@/components/brief/progress-bar";
import { AnchorRail } from "@/components/brief/anchor-rail";
import { KeyboardShortcuts } from "@/components/brief/keyboard-shortcuts";
```

Add inside the article (above `<BriefHeader>`):

```tsx
<ProgressBar />
<AnchorRail count={display.items.length} />
<KeyboardShortcuts count={display.items.length} />
```

- [ ] **Step 6: Verify**

Run dev. Visit `/brief/latest` (or a published date). Confirm:
- Hairline mauve progress bar fills as you scroll.
- On wide screens (≥1280px), a sticky number rail appears on the left; current item highlights in mauve.
- Press `j` / `k` to jump between items. `g` / `G` to top/bottom. `?` opens help.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/use-scroll-progress.ts apps/web/components/brief/progress-bar.tsx apps/web/components/brief/anchor-rail.tsx apps/web/components/brief/keyboard-shortcuts.tsx apps/web/app/brief/[date]/page.tsx
git commit -m "Frontend redesign: brief anchor rail, progress bar, keyboard shortcuts"
```

---

## Task 12: Brief reader — preview gate + edition nav

**Files:**
- Modify: `apps/web/components/brief/preview-gate.tsx`
- Create: `apps/web/components/brief/edition-nav.tsx`
- Modify: `apps/web/app/brief/[date]/page.tsx`
- Modify: `apps/web/convex/briefs.ts` (only if a neighbor-edition query is missing — see notes)

- [ ] **Step 1: PreviewGate full implementation**

Replace `apps/web/components/brief/preview-gate.tsx` with:

```tsx
import { BoxFrame } from "@/components/terminal";
import { EmailSignup } from "@/components/email-signup";

interface Props {
  remaining: number;
}

export function PreviewGate({ remaining }: Props) {
  if (remaining <= 0) {
    return (
      <div className="mt-16 max-w-[var(--w-prose)]">
        <BoxFrame label="locked" tone="accent">
          <p className="text-[color:var(--color-subtext1)] mb-4">
            Subscribe to read full summaries, commentary, and source links for every edition.
          </p>
          <EmailSignup id="brief-email" />
        </BoxFrame>
      </div>
    );
  }
  return (
    <div className="mt-16 max-w-[var(--w-prose)]">
      <BoxFrame label="access required" tone="accent">
        <p className="text-[color:var(--color-subtext1)] mb-4">
          The remaining <span className="text-[color:var(--color-text)]">{remaining}</span> items are
          unlocked for subscribers.
        </p>
        <EmailSignup id="brief-email" />
      </BoxFrame>
    </div>
  );
}
```

- [ ] **Step 2: Inspect the existing Convex briefs API for neighbor lookups**

Run:

```bash
cat "/Users/joshferrara/Desktop/AI Projects/Personal/The Pull/apps/web/convex/briefs.ts" | head -120
```

If there is no `getNeighbors`-style query, **skip the neighbor nav** — render `EditionNav` with both neighbors undefined. Adding a Convex query is out of this task's scope; the brief page can either show only "prev/next" links to the archive, or omit the section. Choose to render a single "back to archive" pane instead. This keeps the redesign visual-only.

- [ ] **Step 3: EditionNav (archive-fallback variant)**

Create `apps/web/components/brief/edition-nav.tsx`:

```tsx
import Link from "next/link";
import { AsciiRule, PromptLine } from "@/components/terminal";

interface Props {
  date: string;
}

export function EditionNav({ date }: Props) {
  return (
    <div className="mt-16">
      <AsciiRule label="eof" />
      <div className="mt-4">
        <PromptLine path={`~/ed-${date}`}>exit</PromptLine>
      </div>
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <Link
          href="/archive"
          className="rounded-lg border border-[color:var(--color-rule)] p-4 no-underline hover:bg-[color:var(--color-mantle)] transition-colors"
        >
          <div className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay1)]">
            ← archive
          </div>
          <div className="mt-1 text-[color:var(--color-text)]">all editions</div>
        </Link>
        <Link
          href="/brief/latest"
          className="rounded-lg border border-[color:var(--color-rule)] p-4 no-underline hover:bg-[color:var(--color-mantle)] transition-colors"
        >
          <div className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay1)]">
            latest →
          </div>
          <div className="mt-1 text-[color:var(--color-text)]">today&apos;s brief</div>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire EditionNav into the brief page**

In `apps/web/app/brief/[date]/page.tsx`, replace the old `<footer>...curl install...</footer>` block with:

```tsx
<EditionNav date={display.date} />
```

And add the import:

```tsx
import { EditionNav } from "@/components/brief/edition-nav";
```

- [ ] **Step 5: Verify**

Run dev. Visit an existing brief without auth. Confirm:
- First 3 items render in full (or partial if no auth).
- Below items, the `<BoxFrame label="access required">` shows with email signup inline.
- "eof" rule + `~/ed-DATE $ exit` prompt + two-pane nav (archive / latest) at bottom.

If authenticated (`?t=...` valid), all items show, and the gate hides.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/brief/preview-gate.tsx apps/web/components/brief/edition-nav.tsx apps/web/app/brief/[date]/page.tsx
git commit -m "Frontend redesign: brief preview gate + edition nav"
```

---

## Task 13: Archive — table, filters, empty, stats

**Files:**
- Create: `apps/web/components/archive/archive-table.tsx`
- Create: `apps/web/components/archive/archive-filters.tsx`
- Create: `apps/web/components/archive/archive-empty.tsx`
- Create: `apps/web/components/archive/archive-stats.tsx`
- Modify: `apps/web/app/archive/page.tsx`

- [ ] **Step 1: Look at the actual archive query shape**

Run:

```bash
grep -n "listPublished" "/Users/joshferrara/Desktop/AI Projects/Personal/The Pull/apps/web/convex/briefs.ts"
```

Confirm what fields each row exposes (likely `_id`, `date`, `edition`, `itemCount`). If `topCategories` / `glimpse` are NOT exposed, the table degrades gracefully — those columns simply don't render. **Do not extend the Convex query** in this redesign.

- [ ] **Step 2: ArchiveTable**

Create `apps/web/components/archive/archive-table.tsx`:

```tsx
import Link from "next/link";

export interface ArchiveRow {
  _id: string;
  date: string;
  edition: number;
  itemCount?: number;
}

interface Props {
  rows: ArchiveRow[];
}

export function ArchiveTable({ rows }: Props) {
  return (
    <div className="rounded-lg border border-[color:var(--color-rule)] overflow-hidden">
      <div className="grid grid-cols-[4rem_1fr_4rem] sm:grid-cols-[4rem_8rem_5rem_1fr] gap-x-4 px-4 py-2 border-b border-[color:var(--color-rule)] bg-[color:var(--color-mantle)] font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay1)]">
        <span>#</span>
        <span className="hidden sm:block">date</span>
        <span>items</span>
        <span>glimpse</span>
      </div>
      <ul>
        {rows.map((r, i) => (
          <li key={r._id}>
            <Link
              href={`/brief/${r.date}`}
              className="grid grid-cols-[4rem_1fr_4rem] sm:grid-cols-[4rem_8rem_5rem_1fr] gap-x-4 px-4 py-2.5 items-center border-b border-[color:var(--color-rule)] last:border-b-0 hover:bg-[color:var(--color-mantle)] no-underline transition-colors"
            >
              <span className="font-mono text-[var(--text-caption)] tabular-nums text-[color:var(--color-text)]">
                #{String(r.edition).padStart(3, "0")}
                {i < 5 && (
                  <span
                    className="text-[color:var(--color-mauve)] ml-1"
                    style={{ opacity: 1 - i * 0.18 }}
                  >
                    *
                  </span>
                )}
              </span>
              <span className="hidden sm:block font-mono text-[var(--text-caption)] text-[color:var(--color-subtext0)]">
                {r.date}
              </span>
              <span className="font-mono text-[var(--text-caption)] tabular-nums text-[color:var(--color-overlay1)]">
                {r.itemCount ?? "—"}
              </span>
              <span className="text-[var(--text-caption)] text-[color:var(--color-subtext1)] truncate">
                <span className="sm:hidden font-mono text-[color:var(--color-overlay1)] mr-2">
                  {r.date}
                </span>
                edition {r.edition}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

(Hover-expand inline preview deferred — the Convex query doesn't return item titles, so it'd require a backend change. Plain mono table only here.)

- [ ] **Step 3: ArchiveFilters (URL-driven, optional)**

Since the Convex query doesn't return categories, the filter cluster has no real data to act on. Render a **disabled-looking** filter strip that says "filtering coming soon" — keeps the visual shape without lying. Create `apps/web/components/archive/archive-filters.tsx`:

```tsx
import { MetaChip } from "@/components/terminal";

export function ArchiveFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 text-[var(--text-caption)]">
      <span className="font-mono text-[color:var(--color-overlay1)]">filter:</span>
      <MetaChip label="all" variant="mauve" />
      <MetaChip label="models" variant="muted" />
      <MetaChip label="tooling" variant="muted" />
      <MetaChip label="research" variant="muted" />
      <span className="ml-2 font-mono text-[var(--text-micro)] text-[color:var(--color-overlay0)]">
        (filtering · coming soon)
      </span>
    </div>
  );
}
```

- [ ] **Step 4: ArchiveEmpty**

Create `apps/web/components/archive/archive-empty.tsx`:

```tsx
import Link from "next/link";
import { TerminalPane } from "@/components/terminal";

export function ArchiveEmpty() {
  return (
    <div className="mt-6 max-w-[var(--w-wide)]">
      <TerminalPane title="bash — empty">
        <pre className="p-5 whitespace-pre-wrap leading-relaxed text-[color:var(--color-text)]">
          <span className="text-[color:var(--color-prompt)]">$</span> ls briefs/{"\n"}
          <span className="text-[color:var(--color-overlay1)]">ls: briefs/: no files yet.</span>
          {"\n\n"}
          Hint: the first edition is around the corner.{"\n"}
          Subscribe and I&apos;ll let you know.
        </pre>
        <div className="border-t border-[color:var(--color-surface1)] px-4 py-3">
          <Link
            href="/#email"
            className="inline-block px-3 py-1.5 rounded-md bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium text-[var(--text-caption)] no-underline"
          >
            subscribe →
          </Link>
        </div>
      </TerminalPane>
    </div>
  );
}
```

- [ ] **Step 5: ArchiveStats**

Create `apps/web/components/archive/archive-stats.tsx`:

```tsx
import { AsciiRule } from "@/components/terminal";

interface Props {
  editions: number;
  earliest?: string;
}

export function ArchiveStats({ editions, earliest }: Props) {
  return (
    <div className="mt-12">
      <AsciiRule label="stats" />
      <p className="mt-3 font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
        total: {editions} {editions === 1 ? "edition" : "editions"}
        {earliest && <> · running since {earliest}</>}
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Update archive page**

Replace `apps/web/app/archive/page.tsx` with:

```tsx
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { ArchiveTable } from "@/components/archive/archive-table";
import { ArchiveFilters } from "@/components/archive/archive-filters";
import { ArchiveEmpty } from "@/components/archive/archive-empty";
import { ArchiveStats } from "@/components/archive/archive-stats";
import { PromptLine, StatusBar } from "@/components/terminal";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const briefs = await convexClient().query(api.briefs.listPublished, { limit: 90 });
  const earliest = briefs[briefs.length - 1]?.date;

  return (
    <article className="max-w-[var(--w-grid)] mx-auto px-6 py-12">
      <header className="mb-8">
        <PromptLine path="~/the-pull">ls -la briefs/</PromptLine>
        <h1 className="mt-4 text-[var(--text-h1)] font-semibold text-[color:var(--color-text)] leading-tight">
          Archive
        </h1>
        <p className="mt-2 font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
          {briefs.length} {briefs.length === 1 ? "edition" : "editions"}
          {earliest && <> · since {earliest}</>}
        </p>
        <ArchiveFilters />
      </header>

      {briefs.length === 0 ? (
        <ArchiveEmpty />
      ) : (
        <>
          <ArchiveTable rows={briefs.map((b) => ({
            _id: b._id,
            date: b.date,
            edition: b.edition,
            itemCount: b.itemCount,
          }))} />
          <ArchiveStats editions={briefs.length} earliest={earliest} />
        </>
      )}

      <StatusBar path="~/archive" />
    </article>
  );
}
```

- [ ] **Step 7: Verify**

Run dev. Visit `/archive`. Confirm:
- Eyebrow `~/the-pull $ ls -la briefs/`.
- Filter chips render (muted, "coming soon").
- Table with mono headers, hairline rules, fading `*` glyphs on top 5 rows.
- Empty state renders if briefs list is empty.
- Stats line at bottom.

- [ ] **Step 8: Commit**

```bash
git add apps/web/components/archive/ apps/web/app/archive/page.tsx
git commit -m "Frontend redesign: archive table, filters placeholder, empty + stats"
```

---

## Task 14: Dashboard — three panels + token reveal card

**Files:**
- Create: `apps/web/components/dashboard/preferences-panel.tsx`
- Create: `apps/web/components/dashboard/tokens-panel.tsx`
- Create: `apps/web/components/dashboard/token-reveal-card.tsx`
- Create: `apps/web/components/dashboard/danger-zone.tsx`
- Modify: `apps/web/components/dashboard-client.tsx`
- Modify: `apps/web/app/dashboard/page.tsx`

Re-styling pass only — the API surface and data flow are unchanged. Existing `dashboard-client.tsx` is refactored into three sub-components with the new visual language.

- [ ] **Step 1: TokenRevealCard**

Create `apps/web/components/dashboard/token-reveal-card.tsx`:

```tsx
"use client";

import { useState } from "react";
import { BoxFrame } from "@/components/terminal";

interface Props {
  token: string;
  onDismiss: () => void;
}

export function TokenRevealCard({ token, onDismiss }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="mt-4">
      <BoxFrame label="new token · copy now" tone="warn">
        <code className="block break-all font-mono text-[var(--text-caption)] text-[color:var(--color-text)] bg-[color:var(--color-mantle)] rounded p-2 mb-3">
          {token}
        </code>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copy}
            className="px-3 py-1.5 rounded-md bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium text-[var(--text-caption)]"
          >
            {copied ? "✓ copied" : "⎘ copy token"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)] hover:text-[color:var(--color-text)]"
          >
            dismiss
          </button>
          <span className="ml-auto font-mono text-[var(--text-micro)] text-[color:var(--color-peach)]">
            ⚠ shown once
          </span>
        </div>
      </BoxFrame>
    </div>
  );
}
```

- [ ] **Step 2: TokensPanel**

Create `apps/web/components/dashboard/tokens-panel.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { BoxFrame, MetaChip } from "@/components/terminal";
import { TokenRevealCard } from "./token-reveal-card";

export interface TokenView {
  id: string;
  token: string;
  scope: "api" | "rss" | "cli";
  label?: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

interface Props {
  tokens: TokenView[];
  onCreate: (scope: TokenView["scope"], label: string) => Promise<string | null>;
  onRevoke: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function TokensPanel({ tokens, onCreate, onRevoke, onRefresh }: Props) {
  const [scope, setScope] = useState<TokenView["scope"]>("api");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const t = await onCreate(scope, label);
      if (t) setNewToken(t);
      setLabel("");
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <BoxFrame label="api tokens">
        <form onSubmit={create} className="flex flex-wrap items-end gap-2 mb-4">
          <label className="flex flex-col gap-1 text-[var(--text-micro)] font-mono text-[color:var(--color-overlay1)]">
            scope
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as TokenView["scope"])}
              className="px-2 py-1.5 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] text-[var(--text-caption)] text-[color:var(--color-text)]"
            >
              <option value="api">api</option>
              <option value="rss">rss</option>
              <option value="cli">cli</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[var(--text-micro)] font-mono text-[color:var(--color-overlay1)] flex-1 min-w-[12rem]">
            label
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="my laptop"
              className="px-2 py-1.5 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] text-[var(--text-caption)] text-[color:var(--color-text)]"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="px-3 py-1.5 rounded-md bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium text-[var(--text-caption)] disabled:opacity-50"
          >
            {busy ? "…" : "generate"}
          </button>
        </form>

        {newToken && <TokenRevealCard token={newToken} onDismiss={() => setNewToken(null)} />}

        <div className="mt-2">
          {tokens.length === 0 ? (
            <p className="font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
              no tokens yet.
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--color-rule)]">
              {tokens.map((t) => (
                <li key={t.id} className={"py-3 flex flex-wrap items-center gap-3 " + (t.revoked ? "opacity-50" : "")}>
                  <MetaChip label={t.scope} variant="mauve" />
                  <span className="text-[var(--text-body-sm)] text-[color:var(--color-text)]">
                    {t.label ?? <span className="text-[color:var(--color-overlay1)]">(no label)</span>}
                  </span>
                  <span className="font-mono text-[var(--text-micro)] text-[color:var(--color-overlay1)]">
                    {t.last_used_at ? `last used ${t.last_used_at}` : "never used"}
                  </span>
                  {t.revoked ? (
                    <span className="ml-auto font-mono text-[var(--text-micro)] text-[color:var(--color-overlay1)] line-through">
                      revoked
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startTransition(() => void onRevoke(t.id))}
                      className="ml-auto font-mono text-[var(--text-micro)] text-[color:var(--color-red)] hover:underline"
                    >
                      revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </BoxFrame>
    </section>
  );
}
```

- [ ] **Step 3: PreferencesPanel**

Create `apps/web/components/dashboard/preferences-panel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { BoxFrame } from "@/components/terminal";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

interface Props {
  initialEmailEnabled: boolean;
  initialAnalyticsOptOut: boolean;
  initialTimezone: string;
}

export function PreferencesPanel({
  initialEmailEnabled,
  initialAnalyticsOptOut,
  initialTimezone,
}: Props) {
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled);
  const [analyticsOptOut, setAnalyticsOptOut] = useState(initialAnalyticsOptOut);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [flash, setFlash] = useState(false);

  function bump() {
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  }

  async function saveBool(path: string, key: string, value: boolean) {
    await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    bump();
  }

  async function saveTz(tz: string) {
    setTimezone(tz);
    await fetch("/api/v1/me/timezone", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ timezone: tz }),
    });
    bump();
  }

  return (
    <section>
      <BoxFrame label="preferences">
        <dl className="grid grid-cols-[10rem_1fr] gap-y-3 gap-x-6 items-center font-mono text-[var(--text-caption)]">
          <dt className="text-[color:var(--color-overlay1)]">email delivery</dt>
          <dd>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={async (e) => {
                  setEmailEnabled(e.target.checked);
                  await saveBool("/api/v1/me/email", "enabled", e.target.checked);
                }}
              />
              <span className="text-[color:var(--color-text)]">{emailEnabled ? "on" : "off"}</span>
            </label>
          </dd>
          <dt className="text-[color:var(--color-overlay1)]">analytics</dt>
          <dd>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={analyticsOptOut}
                onChange={async (e) => {
                  setAnalyticsOptOut(e.target.checked);
                  await saveBool("/api/v1/me/analytics", "optOut", e.target.checked);
                }}
              />
              <span className="text-[color:var(--color-text)]">{analyticsOptOut ? "opted out" : "opted in"}</span>
            </label>
          </dd>
          <dt className="text-[color:var(--color-overlay1)]">timezone</dt>
          <dd>
            <select
              value={timezone}
              onChange={(e) => void saveTz(e.target.value)}
              className="px-2 py-1.5 rounded bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] text-[var(--text-caption)] text-[color:var(--color-text)]"
            >
              <option value="">— pick one —</option>
              {TIMEZONES.map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
              {timezone && !TIMEZONES.includes(timezone) && (
                <option value={timezone}>{timezone}</option>
              )}
            </select>
          </dd>
        </dl>
        <div
          className={
            "mt-3 font-mono text-[var(--text-micro)] text-[color:var(--color-prompt)] transition-opacity " +
            (flash ? "opacity-100" : "opacity-0")
          }
          aria-live="polite"
        >
          ✓ saved
        </div>
      </BoxFrame>
    </section>
  );
}
```

- [ ] **Step 4: DangerZone**

Create `apps/web/components/dashboard/danger-zone.tsx`:

```tsx
"use client";

import { BoxFrame } from "@/components/terminal";

export function DangerZone() {
  return (
    <section>
      <BoxFrame label="danger zone" tone="warn">
        <p className="text-[var(--text-caption)] text-[color:var(--color-subtext1)] mb-3">
          Unsubscribe and revoke all tokens. This cannot be undone.
        </p>
        <form action="/api/v1/me/unsubscribe" method="POST">
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md border border-[color:var(--color-red)] text-[color:var(--color-red)] font-mono text-[var(--text-caption)] hover:bg-[color:color-mix(in_oklab,var(--color-red)_15%,transparent)]"
          >
            unsubscribe & revoke
          </button>
        </form>
      </BoxFrame>
    </section>
  );
}
```

- [ ] **Step 5: Rewrite dashboard-client.tsx to compose the new panels**

Replace `apps/web/components/dashboard-client.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { PreferencesPanel } from "@/components/dashboard/preferences-panel";
import { TokensPanel, type TokenView } from "@/components/dashboard/tokens-panel";
import { DangerZone } from "@/components/dashboard/danger-zone";

interface Props {
  userId: string;
  initialPreferences: { emailEnabled: boolean; analyticsOptOut: boolean };
  initialTimezone: string;
  initialTokens: TokenView[];
}

export function DashboardClient(props: Props) {
  const [tokens, setTokens] = useState<TokenView[]>(props.initialTokens);

  async function refresh() {
    const resp = await fetch("/api/v1/auth/tokens");
    if (resp.ok) {
      const data = (await resp.json()) as { tokens: TokenView[] };
      setTokens(data.tokens);
    }
  }

  async function createToken(scope: TokenView["scope"], label: string): Promise<string | null> {
    const resp = await fetch("/api/v1/auth/tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, label }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json().catch(() => null)) as { token?: string } | null;
    return data?.token ?? null;
  }

  async function revoke(id: string) {
    await fetch(`/api/v1/auth/tokens?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="space-y-10">
      <PreferencesPanel
        initialEmailEnabled={props.initialPreferences.emailEnabled}
        initialAnalyticsOptOut={props.initialPreferences.analyticsOptOut}
        initialTimezone={props.initialTimezone}
      />
      <TokensPanel
        tokens={tokens}
        onCreate={createToken}
        onRevoke={revoke}
        onRefresh={refresh}
      />
      <DangerZone />
    </div>
  );
}
```

- [ ] **Step 6: Update dashboard page header**

Replace the top of `apps/web/app/dashboard/page.tsx` so it uses the new style. Replace the file with:

```tsx
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { DashboardClient } from "@/components/dashboard-client";
import { PromptLine } from "@/components/terminal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await readSession();
  if (!session) redirect("/?reauth=1");
  const user = await convexClient().query(api.users.getById, { userId: session.userId });
  if (!user) redirect("/");
  const tokens = await convexClient().query(api.tokens.listForUser, { userId: session.userId });
  const signupDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <article className="max-w-[var(--w-wide)] mx-auto px-6 py-12">
      <header className="mb-12">
        <PromptLine path="~/account">whoami</PromptLine>
        <h1 className="mt-4 font-mono text-[var(--text-h2)] text-[color:var(--color-text)] break-all">
          {user.email}
        </h1>
        <p className="mt-1 font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
          member since {signupDate} · tier: free
        </p>
      </header>
      <DashboardClient
        userId={session.userId}
        initialPreferences={user.preferences}
        initialTimezone={user.timezone ?? ""}
        initialTokens={tokens.map((t) => ({
          id: t._id,
          token: t.token,
          scope: t.scope,
          label: t.label,
          created_at: new Date(t.createdAt).toISOString(),
          last_used_at: t.lastUsedAt ? new Date(t.lastUsedAt).toISOString() : null,
          revoked: !!t.revokedAt,
        }))}
      />
    </article>
  );
}
```

- [ ] **Step 7: Verify**

Run typecheck + lint + dev. Sign in if needed, visit `/dashboard`. Confirm:
- Email renders large in mono as the page identity.
- Three labeled `<BoxFrame>` panels: preferences, api tokens, danger zone.
- Generating a token reveals it in the warn-tone card with copy + dismiss.
- Existing tokens listed with scope chip, label, last-used, revoke button.
- Saving any preference flashes "✓ saved" briefly.

- [ ] **Step 8: Commit**

```bash
git add apps/web/components/dashboard/ apps/web/components/dashboard-client.tsx apps/web/app/dashboard/page.tsx
git commit -m "Frontend redesign: dashboard panels with token reveal card"
```

---

## Task 15: Verify — boot sequence

**Files:**
- Create: `apps/web/components/verify/boot-sequence.tsx`
- Modify: `apps/web/components/verify-client.tsx`
- Modify: `apps/web/app/verify/page.tsx` (only if it sets layout — usually unchanged)

- [ ] **Step 1: BootSequence animation component**

Create `apps/web/components/verify/boot-sequence.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { TerminalPane } from "@/components/terminal";

interface Step {
  label: string;
  status: "pending" | "running" | "ok" | "err";
}

interface Props {
  tokenPreview?: string;
  finalMessage: string;
  errored?: boolean;
}

const STEPS_TEMPLATE: Step["label"][] = [
  "resolving identity",
  "checking expiration",
  "minting session",
];

export function BootSequence({ tokenPreview = "tp_••••", finalMessage, errored }: Props) {
  const [steps, setSteps] = useState<Step[]>(
    STEPS_TEMPLATE.map((label) => ({ label, status: "pending" })),
  );
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setSteps(STEPS_TEMPLATE.map((label) => ({ label, status: errored ? "err" : "ok" })));
      setShowFinal(true);
      return;
    }
    let cancelled = false;
    (async () => {
      for (let i = 0; i < STEPS_TEMPLATE.length; i++) {
        if (cancelled) return;
        setSteps((curr) =>
          curr.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)),
        );
        await delay(380);
        if (cancelled) return;
        setSteps((curr) =>
          curr.map((s, idx) =>
            idx === i ? { ...s, status: errored && i === STEPS_TEMPLATE.length - 1 ? "err" : "ok" } : s,
          ),
        );
      }
      await delay(220);
      if (!cancelled) setShowFinal(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [errored]);

  return (
    <TerminalPane title="bash — verify">
      <div className="p-5 leading-relaxed">
        <div>
          <span className="text-[color:var(--color-prompt)]">$</span>{" "}
          <span className="text-[color:var(--color-text)]">verify --token {tokenPreview}</span>
        </div>
        <ul className="mt-3 space-y-1">
          {steps.map((s) => (
            <li key={s.label} className="flex items-baseline gap-2">
              <span className="text-[color:var(--color-overlay1)]">→</span>
              <span className="flex-1 text-[color:var(--color-subtext1)]">{s.label}</span>
              <span className="w-4 text-right">{statusGlyph(s.status)}</span>
            </li>
          ))}
        </ul>
        <div
          className={
            "mt-4 transition-opacity duration-300 " +
            (showFinal ? "opacity-100" : "opacity-0")
          }
          aria-live="polite"
        >
          <span className={errored ? "text-[color:var(--color-red)]" : "text-[color:var(--color-text)]"}>
            {finalMessage}
          </span>
        </div>
      </div>
    </TerminalPane>
  );
}

function statusGlyph(s: Step["status"]) {
  switch (s) {
    case "pending":
      return <span className="text-[color:var(--color-overlay0)]">…</span>;
    case "running":
      return <span className="caret bg-[color:var(--color-text)]" />;
    case "ok":
      return <span className="text-[color:var(--color-prompt)]">✓</span>;
    case "err":
      return <span className="text-[color:var(--color-red)]">✗</span>;
  }
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
```

- [ ] **Step 2: Rewire verify-client.tsx to use BootSequence**

Replace `apps/web/components/verify-client.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BootSequence } from "@/components/verify/boot-sequence";

interface Props {
  code?: string;
  cliCallback?: string;
  next: string;
}

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "cli_done"; token: string }
  | { kind: "redirecting"; greeting: string };

export function VerifyClient({ code, cliCallback, next }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!code) {
      setState({ kind: "error", message: "missing code." });
      return;
    }
    (async () => {
      try {
        const resp = await fetch("/api/v1/auth/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code, cli_callback: cliCallback }),
        });
        if (!resp.ok) {
          const body = (await resp.json().catch(() => ({}))) as { error?: string };
          setState({ kind: "error", message: body.error ?? `error_${resp.status}` });
          return;
        }
        const data = (await resp.json()) as { token: string; email?: string };
        if (cliCallback) {
          try {
            await fetch(cliCallback, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ token: data.token }),
            });
          } catch {
            // CLI may have torn down; show token to copy.
          }
          setState({ kind: "cli_done", token: data.token });
        } else {
          setState({
            kind: "redirecting",
            greeting: data.email ? `welcome, ${data.email}.` : "welcome back.",
          });
          setTimeout(() => router.replace(next), 1400);
        }
      } catch {
        setState({ kind: "error", message: "network" });
      }
    })();
  }, [code, cliCallback, next, router]);

  if (state.kind === "error") {
    return (
      <BootSequence
        errored
        finalMessage={`✗ ${state.message} · request a new link →`}
      />
    );
  }
  if (state.kind === "cli_done") {
    return (
      <div className="space-y-4">
        <BootSequence finalMessage="verified. return to your terminal." />
        <p className="font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
          If <code className="text-[color:var(--color-text)]">pull</code> didn&apos;t receive the
          token automatically, copy this and run{" "}
          <code className="text-[color:var(--color-text)]">pull login --token &lt;value&gt;</code>:
        </p>
        <code className="block p-3 bg-[color:var(--color-mantle)] border border-[color:var(--color-rule)] rounded text-[var(--text-caption)] break-all">
          {state.token}
        </code>
      </div>
    );
  }
  if (state.kind === "redirecting") {
    return <BootSequence finalMessage={`${state.greeting} redirecting to ~/dashboard…`} />;
  }
  return <BootSequence finalMessage="" />;
}
```

- [ ] **Step 3: Ensure /verify page wraps content in a centered shell**

Read existing `apps/web/app/verify/page.tsx`:

```bash
cat "/Users/joshferrara/Desktop/AI Projects/Personal/The Pull/apps/web/app/verify/page.tsx"
```

If it doesn't already center, wrap children in:

```tsx
<div className="max-w-md mx-auto px-6 py-24">{/* ...VerifyClient... */}</div>
```

(Edit minimally — preserve existing data flow / props parsing.)

- [ ] **Step 4: Verify**

Run dev. Visit `/verify?code=invalid` to confirm the error sequence renders. With a valid code (use a real magic link if possible), confirm:
- Three steps tick through (resolving identity, checking expiration, minting session).
- Final greeting line appears.
- Redirect happens ~1.4s after final line.
- With reduce-motion enabled, the whole sequence is instant.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/verify/ apps/web/components/verify-client.tsx apps/web/app/verify/page.tsx
git commit -m "Frontend redesign: verify boot-sequence"
```

---

## Task 16: Polish, audit, and cleanup

**Files:**
- All of the above (verification only)
- Modify: `apps/web/app/globals.css` (final tweaks if needed)

- [ ] **Step 1: Reduced-motion audit**

Manually toggle `prefers-reduced-motion: reduce` in DevTools (Rendering tab → "Emulate CSS media feature prefers-reduced-motion"). Visit each page and confirm:
- `/` — typewriter terminal pane renders instantly; live indicator pulse stops; caret stops blinking.
- `/brief/[date]` — progress bar still animates (acceptable, scroll-driven), but no decorative motion runs.
- `/dashboard` — `✓ saved` flash still works (it's <2s and informational; OK).
- `/verify` — boot sequence shows final state instantly.

Fix any animation that ignores the media query.

- [ ] **Step 2: Bundle size delta**

Run a production build and capture the output:

```bash
pnpm --filter @the-pull/web build 2>&1 | tail -40
```

Confirm First Load JS for `/` is reasonable. If it ballooned >25KB gzipped over the prior baseline (`git log -1 --before="<task 1 commit>" -- apps/web` baseline if needed), check whether `LivePreviewPane`, `InstallTabs`, and `KeyboardShortcuts` are correctly client-bounded (they should not pull server code).

- [ ] **Step 3: Lint + typecheck clean**

```bash
pnpm --filter @the-pull/web typecheck
pnpm --filter @the-pull/web lint
```

Both must pass with zero new errors.

- [ ] **Step 4: Manual smoke on each surface**

Run dev, click through:
- `/` — every section renders, hero animation plays, copy buttons work, FAQ expands, email signup succeeds (or fails with friendly error).
- `/archive` — table renders with mono columns; if empty, empty state shows.
- `/brief/latest` — header, items with chips, links sub-table; keyboard `j/k/g/G/?` works; preview gate renders when not authed.
- `/dashboard` — three panels render; preferences save; token generation reveal works.
- `/verify?code=...` — boot sequence plays; success redirects.

- [ ] **Step 5: Status bar across pages**

Confirm:
- Pinned on `/`, `/brief/*`, `/archive`.
- Hidden on `/dashboard`, `/verify`.
- Dismiss button works and persists via localStorage.
- Scanline toggle in footer works and persists.

- [ ] **Step 6: Commit any final tweaks**

If the polish pass produced any small fixes:

```bash
git add -A
git commit -m "Frontend redesign: polish pass — reduced-motion, smoke checks"
```

If nothing changed, skip the commit. The redesign is complete.

---

## Self-Review

Coverage check against spec (`docs/superpowers/specs/2026-05-12-frontend-visual-redesign-design.md`):

- **§1 Foundations:** Task 1 (tokens, fonts, scale, motion primitives). Tasks 2-3 (terminal primitives). ✓
- **§2 Landing:** Task 5 (shell), Task 6 (hero left + tabs + email), Task 7 (live preview pane), Task 8 (today table), Task 9 (the deal, FAQ, final CTA, deletes). ✓
- **§3 Brief reader:** Task 10 (header + items + links), Task 11 (anchor rail + progress + shortcuts), Task 12 (preview gate + edition nav). ✓
- **§4 Archive:** Task 13. ✓ (Hover-expand inline preview and category filtering are scoped down to placeholders because the Convex query doesn't expose item titles or categories per row; expanding the API is out of scope per spec §9 "no API surface changes." Filter strip renders with "coming soon" tag.)
- **§5 Dashboard:** Task 14. ✓
- **§6 Verify:** Task 15. ✓
- **§7 Global chrome:** Task 4 (header + footer), StatusBar wired into landing/brief/archive in their respective tasks. ✓
- **§8 Implementation notes:** All file paths match the file map at the top of this plan. ✓
- **§9 Out of scope:** Honored. No CMS, no email templates, no light theme, no CLI changes, no schema/API changes.
- **§10 Success criteria:** Verified in Task 16.

**Scope adjustments from spec:** Archive hover-expand and real filtering are downgraded to non-functional placeholders (with copy explaining "coming soon"), because making them real requires a Convex query change that exceeds the visual-redesign scope. Documented in Task 13.

**Type consistency:** all components consume `BriefV1` and `BriefItemV1` from `@the-pull/schema`. If those names differ in the actual schema package, Step 4 of Task 5 surfaces the discrepancy early; later tasks should track the same names.

**Placeholders:** All `[... placeholder]` strings in Task 5 are intentionally stubbed and replaced in subsequent tasks (Hero in Task 6, LivePreviewPane in Task 7, TodayTable in Task 8, TheDeal/FAQ/FinalCta in Task 9, PreviewGate in Task 12). No production placeholders remain after Task 16.
