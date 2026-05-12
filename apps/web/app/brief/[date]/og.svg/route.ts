import { NextRequest } from "next/server";
import { getBriefJson } from "@/lib/r2";

/**
 * Per-brief Open Graph image. Returns a 1200x630 SVG — works in Workers
 * without a binary image dep, and Twitter/Slack/LinkedIn render SVG OG just
 * fine. Cached aggressively since briefs are immutable after publish.
 *
 * Spec section 5.5: `og:image` generated per-brief.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  const brief = await getBriefJson(date);
  if (!brief) {
    return new Response("not found", { status: 404 });
  }

  const note = (brief.editor_note ?? "Today's curated AI brief for developers.")
    .slice(0, 180);
  const itemCount = brief.items.length;
  const mins = Math.max(1, Math.round((brief.stats.total_reading_time_seconds ?? 60) / 60));

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1e2e"/>
      <stop offset="100%" stop-color="#11111b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#cba6f7"/>
      <stop offset="100%" stop-color="#89b4fa"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Prompt -->
  <text x="80" y="120" font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace" font-size="22" fill="#cba6f7">
    ~/the-pull <tspan fill="#7f849c">$</tspan> <tspan fill="#cdd6f4">cat</tspan> <tspan fill="#a6e3a1">brief.md</tspan>
  </text>

  <!-- Title -->
  <text x="80" y="240" font-family="Inter, system-ui, -apple-system, sans-serif" font-weight="800" font-size="80" fill="#cdd6f4">
    The Pull
  </text>
  <text x="80" y="295" font-family="Inter, system-ui, -apple-system, sans-serif" font-weight="600" font-size="40" fill="url(#accent)">
    Edition #${brief.edition} · ${escapeXml(formatDate(brief.date))}
  </text>

  <!-- Editor note -->
  ${wrapText(escapeXml(note), 80, 380, 1060, 30, "#bac2de")}

  <!-- Footer stats -->
  <line x1="80" y1="540" x2="1120" y2="540" stroke="#45475a" stroke-width="2"/>
  <text x="80" y="580" font-family="Inter, system-ui, sans-serif" font-size="24" fill="#a6adc8">
    ${itemCount} ${itemCount === 1 ? "item" : "items"} · ~${mins} min read
  </text>
  <text x="1120" y="580" font-family="ui-monospace, 'SF Mono', monospace" font-size="24" fill="#7f849c" text-anchor="end">
    thepull.dev
  </text>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}

function formatDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Greedy word-wrap into <text>/<tspan> at a given y, advancing line height.
 * Good enough for OG cards. No fancy hyphenation.
 */
function wrapText(
  text: string,
  x: number,
  y: number,
  maxWidthPx: number,
  fontSize: number,
  fill: string,
): string {
  // Approx 0.55em average character width for Inter at this size.
  const avgChar = fontSize * 0.55;
  const maxChars = Math.floor(maxWidthPx / avgChar);
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if (!current) {
      current = w;
    } else if ((current + " " + w).length <= maxChars) {
      current = current + " " + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return `<text x="${x}" y="${y}" font-family="Inter, system-ui, sans-serif" font-size="${fontSize}" fill="${fill}">
${lines
  .slice(0, 4)
  .map((l, i) => `    <tspan x="${x}" dy="${i === 0 ? 0 : fontSize * 1.3}">${l}</tspan>`)
  .join("\n")}
  </text>`;
}
