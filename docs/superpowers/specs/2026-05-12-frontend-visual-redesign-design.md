# Frontend Visual Redesign — Design Spec

**Date:** 2026-05-12
**Surface:** `apps/web` (Next.js 15 on Cloudflare Workers via OpenNext)
**Approach:** C — "Vercel precision, Warp signature"
**Goal priority:** Convert > Credibility > Distinctive

## Summary

Elevate The Pull's web surface from a competent dark-themed dev landing page into a memorable, conversion-focused product that reads as both editorially serious and terminal-native. Keep the existing Catppuccin Mocha palette and overall information architecture; rebuild the visual language on top of a real design system, introduce a small set of reusable terminal primitives, and bring deliberate motion to a few signature moments.

Pages in scope: `/` (landing), `/brief/[date]` (reader), `/archive`, `/dashboard`, `/verify`.

## Constraints

- **Runtime:** Cloudflare Workers via OpenNext. Bundle size matters — no Framer Motion, no heavy animation libs. CSS animations + tiny `useEffect` hooks only.
- **Existing palette:** Catppuccin Mocha stays. New tokens are additive.
- **Existing fonts:** JetBrains Mono stays. Inter is replaced by Geist via `next/font`.
- **Accessibility:** every animation gated on `prefers-reduced-motion`. Mono frames render via CSS pseudo-elements so text stays selectable.
- **Single curator:** dashboard/verify do not need multi-tenant scaffolding.

## 1. Foundations

### Typography
- **Sans:** Geist (via `next/font`, self-hosted, zero-CLS). Headings + body.
- **Mono:** JetBrains Mono. Reserved for metadata, edition numbers, command snippets, status text, ASCII rules, chip labels.
- **Display numerals:** JetBrains Mono, weight 600, tabular figures, tight tracking. Used for edition numbers (`#042`).
- **Scale (rem):** `0.6875` micro · `0.8125` caption · `0.9375` body sm · `1.0625` body · `1.25` h3 · `1.625` h2 · `2.5` h1 · `4` display.

### Color tokens (additive)
Keep all existing Catppuccin tokens unchanged. Add:
```css
--color-accent: var(--color-mauve);      /* single primary */
--color-prompt: var(--color-green);      /* only for $ prompt + OK status */
--color-rule: color-mix(in oklab, var(--color-surface1) 60%, transparent);
--color-glow: color-mix(in oklab, var(--color-mauve) 25%, transparent);
```
Stop scattering peach/yellow/green for variety — collapse to mauve + neutral. Green only on the `$` prompt and "OK/live" status pings.

### Spacing & widths
- 8px base. Tight component padding (`12 / 16 / 24`), generous section rhythm (`64 / 96 / 128`).
- `--w-prose: 38rem` (608px), `--w-wide: 56rem` (896px), `--w-grid: 72rem`.

### Motion principles
- CSS animations + tiny custom hooks only.
- Every animation wrapped in `prefers-reduced-motion` guard (reduced = static end state).
- Scanline overlay = separate fixed element behind `localStorage` toggle, off by default. Toggle in footer.

### Terminal primitives (new shared components)
Location: `apps/web/components/terminal/`.

- `<PromptLine>` — renders `~/path $ command` with optional blinking caret. Variants: `idle`, `typing` (animates in), `done`.
- `<AsciiRule>` — section divider. Auto-fills width with `─` via CSS background-image (not unicode in DOM). Accepts a label: `── 02 · how it works ──────────`.
- `<StatusBar>` — pinned bottom-of-viewport. Mono cells separated by `·`. ~36px tall, backdrop-blur, dismissable, sticky.
- `<MetaChip>` — small mono pill. Optional bar-graph variant (`▓▓▓░░`). Used for category + importance.
- `<EditionNumber>` — display-scale `#042`, tabular figures.
- `<TerminalPane>` — the macOS-style window frame (traffic lights, title `bash — the-pull`) used for install snippet and live preview.
- `<BoxFrame>` — generic box-drawing frame wrapper. Renders via CSS pseudo-elements + corner pieces (`╭ ╮ ╰ ╯`) so content reflows.

## 2. Landing page (`/`)

Top-to-bottom flow:

### 2.1 Header strip (sticky, hairline border)
- Left: `[ the pull ]` mono lockup. Brackets = sibling of `~/path` aesthetic.
- Right: `archive · brief · subscribe` mono nav + `● live · ed.#042` indicator (green dot pulses every 4s).
- No center logo. Resist filling space.

### 2.2 Hero (~88vh, two-column desktop, stack mobile)

**Left column (value prop):**
- Eyebrow (mono uppercase): `~/the-pull $ today --preview`
- H1 (display sans, ~64px desktop / ~40px mobile): **"The daily AI brief, delivered where you build."**
- Sub-headline (subtext1, max-w-md): "For developers who can't keep up with AI but need to. 7ish items, weekday mornings, in your terminal, agent, inbox, or feed reader."
- Primary action: redesigned `TabSwitcher` — three tabs as a segmented mono control with `[ active ]` bracket framing. Snippet rendered inside `<TerminalPane>` (traffic-light dots, window title `bash — the-pull`). Copy-to-clipboard becomes a real button with `⌘C` kbd hint and a `✓ copied` toast.
- Below tabs: "or get it in your inbox" link expands inline to email form on click.

**Right column (signature moment — live brief preview as terminal output):**
- `<TerminalPane>` with the same chrome.
- Top line types in: `$ curl -s https://thepull.dev/api/v1/today.json | jq` (typewriter, ~600ms).
- Then JSON-ish output paints in line by line (200ms stagger): edition number, date, item titles with category chips and importance bar. Data from existing `getLatestPreview()` server call.
- Bottom line: `$ ▮` blinking caret.
- Hover an item → row highlight + mono tooltip with category + importance score.
- Below pane: low-key secondary CTA — `↑ today's brief. unlock full content →` linking to email form anchor.

### 2.3 `── 01 · today's brief ──`
- Existing "Today's preview" replaced with a **mono table**: `# · category · importance · title`.
- Importance column renders `<MetaChip>` with `▓▓▓░░` indicator bar.
- **Visual teaser gate** = first 4 rows render fully legible; remaining rows have their backgrounds gradient-fade and titles dim toward a subscribe CTA card embedded at the bottom of the table. This is a visual conversion treatment — the data shown is still public-preview level (title + category only, same as today). Replaces the current "→ Unlock full content with signup" link.

### 2.4 `── 02 · the deal ──`
Replaces the old "How it works" workflow framing with outcome-focused value prop. Three blocks, three columns desktop / stacked mobile. No glyphs (keeps it tight).

- **[ I read the web so you don't have to ]** — "Every weekday I scour Twitter, GitHub, Hacker News, papers, and dev blogs for the AI news that actually matters to people who ship code."
- **[ 7ish items. Yesterday's signal. ]** — "Not a feed. Not a daily roundup of everything. The handful of things that moved the needle for AI-adjacent builders in the last 24 hours."
- **[ Read it where you already are ]** — "Terminal, agent, inbox, or feed reader. One brief, four channels, six AM ET."

Each block: `<PromptLine>`-style bracketed mono headline + 2-3 sentence sans body. Second-person, plain English.

### 2.5 `── 03 · faq ──`
Short FAQ — three questions, collapsed by default. Mono `Q.` question prefixes, chevron rotates on open.

- "What if I already follow AI news?" → curation, 7ish items
- "What's in it?" → list categories with `<MetaChip>`s
- "Pricing?" → free for now, may add paid tier later

### 2.6 Final CTA strip (above footer)
Wide `<TerminalPane>`: `~/the-pull $ subscribe <email>`. Email pre-fills if the user typed it earlier on the page (via in-memory state). Submit on Enter.

### 2.7 Footer
- Three columns desktop: brand + tagline · "the brief" links · "the project" links (GitHub, RSS, status).
- Bottom-bottom line: `# ferrara, j. — 2026 · built with ☕ + claude`. Mono.
- CRT toggle + (future) theme toggle tucked top-right of footer.

### Removed from current landing
- "How it works" 3-up (workflow framing). Replaced by "the deal" (§2.4).
- "From the field" testimonials section. Deleted entirely (placeholders actively hurt credibility). Wired via `testimonials.ts` config — empty array = section hidden — so it can be reintroduced when real quotes exist.

## 3. Brief reader (`/brief/[date]`)

### 3.1 Header
- Eyebrow (mono): `~/brief/2026-05-12 $ cat`
- `<EditionNumber>` huge — `#042` in display mono, mauve, tabular figures, sits left like a page index.
- Right of number: full date (Geist, 1.5rem) + mono one-liner `7 items · published 06:00 ET · ⏎ ↓ to read`.
- Editor note in `<BoxFrame>` labeled `editor note` (replaces current `border-l-2` treatment).

### 3.2 Item layout

**Anchor rail (desktop):** Vertical mono numbering column on the left, sticky to viewport. Shows `01 02 03 …` with current item highlighted in mauve. Click any number to jump.

**Item card:**
- Top row: `<MetaChip>` (category) + `<MetaChip>` (importance with bar indicator). Right-aligned mono "read N min" estimate (computed from char count).
- Headline: Geist sans, weight 600, 1.5rem desktop.
- Summary: Geist sans, body size, line-height 1.7, max 60ch.
- Commentary: rendered as `>` mono-prefixed quote, mauve-tinted, italic.
- Links: sub-table with mono `─ type · url` rows. Hover reveals favicon.
- Item separator: `<AsciiRule>` with next item's number embedded — `─── 02 ───────────────────`.

### 3.3 Reading enhancements
- **Progress bar:** 1px mauve fill at viewport top, mono percent at far right.
- **Keyboard shortcuts:** `j/k` jump items, `g` top, `G` bottom, `?` help overlay. Hint visible in footer prompt.
- **Per-item copy link** action — makes items individually shareable.

### 3.4 Bottom
- `<AsciiRule>` `─── eof ─────────────────────────`.
- `~/ed-042 $ exit` prompt line.
- Next/prev navigation as two side-by-side mono panes (prev edition's #, title teaser, date; next same). Hover lifts slightly. At archive boundaries: `╴ end of archive ╴`.

### 3.5 Preview gate (unauthenticated)
- Existing `toPreview()` strips summary/commentary/links — keep that logic unchanged.
- Layout looks identical to unlocked. First 3 items render with full body content; remaining items (4 through end) sit behind a frosted/scanline-gradient overlay with a single centered `<BoxFrame>`. If a brief has fewer than 4 items total, every item past the first is gated:
  ```
  ╭─ access required ─────────────────╮
  │ The remaining N items are unlocked│
  │ for subscribers.                  │
  │                                   │
  │     [ subscribe with email →  ]   │
  ╰───────────────────────────────────╯
  ```
- Inline subscribe form embedded — no jump to homepage required.

### 3.6 Mobile
- Anchor rail collapses into `<details>` "jump to item" widget pinned bottom-left.
- Box-drawing frames fall back gracefully on narrow widths (CSS background-image fill).

## 4. Archive (`/archive`)

### 4.1 Header
- Eyebrow (mono): `~/the-pull $ ls -la briefs/`
- H1: `Archive` (display sans). Subtitle (mono): `42 editions · since jan 2026`.
- Right-aligned filter cluster: `[ all ] [ models ] [ tooling ] [ research ] [ products ]`. URL state via `?cat=models`.
- Mono search box: `find . -name "*..."` placeholder.

### 4.2 Listing
**Mono table with real CSS Grid columns** (not unicode in DOM). Hairline `border-left` separators via `--color-rule`.

```
total 42

# │ date         │ items │ top categories     │ glimpse
──┼──────────────┼───────┼────────────────────┼─────────────────
042│ 2026-05-12   │   7   │ models  tooling    │ Claude 4.7 ships
041│ 2026-05-11   │   6   │ research models    │ DSPy 3 release
…
```

- Each row = full Link. Hover lifts row to `--color-mantle`, separators brighten.
- "Top categories" shows up to 3, mono small caps.
- "Glimpse" = top item title for the edition (~40ch ellipsis).
- Hover-expand: row reveals all item titles for that edition (~150ms animated). Click anywhere navigates.
- Newest 5 editions get fading `*` glyph next to number.

### 4.3 Mobile
- Collapses to `#`, `date`, `glimpse` only. Categories + item count drop to a second smaller line. Hover-expand → tap-expand with chevron.

### 4.4 Empty state
```
$ ls briefs/
ls: briefs/: no files yet.

Hint: the first edition is around the corner.
Subscribe and I'll let you know.

[ subscribe →  ]
```

### 4.5 Stats footer
Above global footer: small mono line — `total: 42 editions · 287 items · 14 categories tracked · uptime since 2026-01-08`. Overlay1 color. `<AsciiRule>` above.

## 5. Dashboard (`/dashboard`)

### 5.1 Header
- Eyebrow (mono): `~/account $ whoami`
- H1: user email in mono, 1.75rem. Email = page identity.
- Subline (mono, overlay1): `member since · may 12 2026 · tier: free`

### 5.2 Three panels (stacked, each `<BoxFrame>`-titled)

**`── preferences ────`**
- Existing prefs (timezone, channels, format) as labeled mono key/value table. Inline editing.
- Save → `✓ saved` inline status flash in `--color-prompt` green, fades after 2s.

**`── api tokens ────`**
- Mono table: `label · scope · created · last used · status`. Right-aligned per-row action menu (rotate, revoke). Revoked tokens render struck-through with `[revoked]` tag.
- "Generate token" CTA opens inline form (label + scope dropdown: `rss` / `cli` / `agent`).
- New token reveal — shown ONCE in a copy-and-warn `<BoxFrame>`:
  ```
  ╭─ new token ─ copy now, you won't see it again ─╮
  │ tp_xxx••••••••••••••••••••••••••••••••••       │
  │                              [ ⎘ copy token ]  │
  ╰────────────────────────────────────────────────╯
  ```

**`── danger zone ────`**
- Account deletion + email change. Small, low-contrast, bottom of page. Confirmation modal — must type email to confirm.

### 5.3 Sidebar nav
Skipped for now — single dashboard page. Revisit if it grows.

## 6. Verify (`/verify`)

Center-stage layout, max-w-sm, vertically centered.

**Boot-sequence animation** on load (~1.5s, reduced-motion fallback = static success state):
```
$ verify --token tp_••••
→ resolving identity        ✓
→ checking expiration       ✓
→ minting session           ✓

welcome, <name-or-email>.
redirecting to ~/dashboard...
```
Lines fade in sequentially. Greeting copy adapts: returning user → `welcome back, <name>`; new account → `welcome, <email>`. Last line replaced with real status — success → redirect, error → mono error line `✗ link expired · request a new one →` linking home.

The animation covers the real `verifyWebToken` HTTP roundtrip — delight instead of spinner.

## 7. Global chrome

Every page renders:
- **Top header strip** with `[ the pull ]` lockup + nav (§2.1).
- **Bottom `<StatusBar>`** (`~/path · ed.#042 · ⏎ subscribe`) on `/`, `/brief/*`, `/archive`. Hidden on `/dashboard`, `/verify` (no subscribe nag for signed-in users).
- **Global footer** (§2.7).

## 8. Implementation notes

### File-level changes
- `apps/web/app/globals.css` — extend `@theme` with new tokens (accent, prompt, rule, glow, widths, scale).
- `apps/web/app/layout.tsx` — load Geist via `next/font/google`. Inject scanline overlay + global header/footer scaffolding.
- `apps/web/components/terminal/` — new directory for shared primitives.
- `apps/web/components/landing/` — break landing into `Hero`, `LivePreviewPane`, `TodayTable`, `TheDeal`, `FAQ`, `FinalCTA` (current `page.tsx` is too monolithic to grow).
- `apps/web/components/brief/` — `BriefHeader`, `AnchorRail`, `Item`, `PreviewGate`, `ProgressBar`, `KeyboardShortcuts`, `EditionNav`.
- `apps/web/components/archive/` — `ArchiveTable`, `ArchiveFilters`, `ArchiveEmpty`.
- `apps/web/components/dashboard/` — `PreferencesPanel`, `TokensPanel`, `DangerZone`, `TokenRevealCard`.
- `apps/web/components/verify-client.tsx` — replace internals with boot-sequence component.
- `apps/web/lib/testimonials.ts` — new, empty array. Drives presence of social proof section if/when populated.

### Things to avoid
- Adding Framer Motion or any animation library — bundle constraint.
- Putting unicode box-drawing chars directly in component markup at section level (breaks reflow). Use CSS pseudo-elements + `background-image` fills.
- Re-introducing the peach/yellow/green workflow accents on landing.
- Introducing per-page CSS files — extend `globals.css` and use Tailwind utilities + arbitrary values.

### Things to verify during implementation
- Bundle size delta vs current production build (target: < +25KB gzipped for the new fonts + components combined).
- LCP on `/` doesn't regress (the live preview animation must not block paint — animation starts after hydration).
- All animations honor `prefers-reduced-motion`.
- Keyboard shortcuts on `/brief/[date]` don't conflict with browser defaults or screen readers.
- Preview gate JSON shape unchanged — `toPreview()` continues to return the same fields.

## 9. Out of scope (explicit)

- CMS surface (`/cms/*`) — curator-only, not part of this pass.
- Light theme / theme toggle — placeholder slot in footer, not implemented.
- Email template redesign — separate effort.
- CLI TUI changes — Catppuccin theme already mirrors, no work needed.
- New API surface or schema changes — strictly presentational.

## 10. Success criteria

- Visitor lands on `/` and sees live brief data rendering as terminal output within 1s of LCP.
- Email signup flow lands in ≤3 clicks from any page.
- Brief reader holds attention through ≥80% of items (anchor rail + progress bar give navigation feedback).
- A screenshot of the landing page is something the curator wants to post.
- Lighthouse a11y score ≥95 on every page.
- Reduced-motion users get a fully functional, static version of everything.
