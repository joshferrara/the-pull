import type { Brief, BriefItem } from "@the-pull/schema";

const CATEGORY_LABELS: Record<BriefItem["category"], string> = {
  model: "Model",
  tool: "Tool",
  protocol: "Protocol",
  research: "Research",
  business: "Business",
  meta: "Meta",
};

const IMPORTANCE_GLYPH: Record<BriefItem["importance"], string> = {
  low: "·",
  medium: "•",
  high: "★",
};

export interface RenderOptions {
  /** Include the "Get this in your terminal" footer. */
  footer?: boolean;
  /** Public web URL prefix for the brief, used in the footer. */
  webBaseUrl?: string;
}

/** Render a brief to markdown. Same output for CLI text and email plain-text fallback. */
export function renderBriefMarkdown(
  brief: Brief,
  opts: RenderOptions = {},
): string {
  const lines: string[] = [];
  lines.push(`# The Pull — Edition #${brief.edition}`);
  lines.push(`_${formatDate(brief.date)} · ${brief.items.length} items_`);
  lines.push("");

  if (brief.editor_note) {
    lines.push("> " + brief.editor_note.split("\n").join("\n> "));
    lines.push("");
  }

  brief.items.forEach((item, i) => {
    lines.push(`## ${i + 1}. ${item.title}`);
    lines.push("");
    lines.push(
      `**${CATEGORY_LABELS[item.category]}** ${IMPORTANCE_GLYPH[item.importance]}` +
        (item.reading_time_seconds
          ? `  ·  ${Math.max(1, Math.round(item.reading_time_seconds / 60))} min read`
          : ""),
    );
    if (item.tags && item.tags.length > 0) {
      lines.push(item.tags.map((t) => `\`${t}\``).join(" "));
    }
    lines.push("");
    if (item.summary) {
      lines.push(item.summary);
      lines.push("");
    }
    if (item.commentary) {
      lines.push(`> ${item.commentary.split("\n").join("\n> ")}`);
      lines.push("");
    }
    if (item.links && item.links.length > 0) {
      item.links.forEach((link, idx) => {
        lines.push(`${idx + 1}. [${link.label}](${link.url}) _(${link.type})_`);
      });
      lines.push("");
    }
    if (item.source) {
      lines.push(
        `_Source: ${item.source.author ? item.source.author + " · " : ""}[${item.source.type}](${item.source.url})_`,
      );
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  });

  if (opts.footer !== false) {
    const base = opts.webBaseUrl ?? "https://thepull.dev";
    lines.push(`_Get this in your terminal: \`curl -fsSL ${base}/install | sh\`_`);
  }

  return lines.join("\n");
}

/** Build an RSS 2.0 XML feed from briefs. Full content in <description>. */
export function renderBriefsRss(args: {
  briefs: Brief[];
  feedUrl: string;
  siteUrl: string;
  title?: string;
  description?: string;
}): string {
  const title = args.title ?? "The Pull";
  const description =
    args.description ??
    "The daily AI brief for developers, delivered where you actually work.";
  const items = args.briefs
    .map((b) => {
      const link = `${args.siteUrl}/brief/${b.date}`;
      const body = renderBriefMarkdown(b, { footer: false });
      return [
        "    <item>",
        `      <title>${xmlEscape(`Edition #${b.edition} — ${formatDate(b.date)}`)}</title>`,
        `      <link>${xmlEscape(link)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(link)}</guid>`,
        `      <pubDate>${new Date(b.published_at).toUTCString()}</pubDate>`,
        `      <description><![CDATA[${body}]]></description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xmlEscape(title)}</title>`,
    `    <link>${xmlEscape(args.siteUrl)}</link>`,
    `    <description>${xmlEscape(description)}</description>`,
    '    <language>en-us</language>',
    `    <atom:link href="${xmlEscape(args.feedUrl)}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

/** Compute reading time in seconds at 200 wpm for the item's narrative text. */
export function estimateReadingTimeSeconds(item: {
  summary?: string;
  commentary?: string;
}): number {
  const words =
    (item.summary?.trim().split(/\s+/).length ?? 0) +
    (item.commentary?.trim().split(/\s+/).length ?? 0);
  if (words === 0) return 0;
  return Math.max(15, Math.round((words / 200) * 60));
}

function formatDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
