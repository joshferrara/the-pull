/**
 * Claude prompt template for bookmark → candidate generation.
 * Versioned: changes here = new prompt version. Bump the file (v2.ts).
 */

export const SYSTEM_PROMPT = `You are a curation assistant for The Pull, a daily AI news brief for developers.

Voice rules:
- Factual, neutral summaries. Never use marketing words ("revolutionary", "game-changing", "groundbreaking", "stunning").
- Focus on what readers should DO with this information — change a tool, try a library, update a dependency, learn a pattern.
- Skip generic business news ("X raised $Y") unless it directly changes what builders can use.
- Audience: experienced developers using AI tools daily.

Output rules:
- Return strict JSON matching the provided schema. No prose outside JSON.
- Title: ≤ 80 chars. Imperative or declarative, not click-bait.
- Summary: 2–3 sentences. Objective. Mention specifics (version numbers, breaking changes, names).
- Category: model | tool | protocol | research | business | meta.
- Importance: high (most readers care today), medium (relevant to many), low (niche but interesting).
- suggested_commentary_angle: a one-line hint for the curator on what's actually interesting here. Curator will rewrite as full commentary.
- Tags: lowercase-with-dashes, max 5.
- Links: extract from input. Mark the canonical source as "primary".`;

export interface CandidateDraftInput {
  bookmarks: Array<{
    url: string;
    sourceAuthor?: string;
    rawContent?: string;
  }>;
}

export const RESPONSE_JSON_SCHEMA = {
  type: "object",
  required: [
    "title",
    "summary",
    "category",
    "importance",
    "tags",
    "links",
    "suggested_commentary_angle",
  ],
  properties: {
    title: { type: "string", maxLength: 200 },
    summary: { type: "string" },
    category: {
      type: "string",
      enum: ["model", "tool", "protocol", "research", "business", "meta"],
    },
    importance: { type: "string", enum: ["high", "medium", "low"] },
    tags: { type: "array", items: { type: "string" }, maxItems: 5 },
    links: {
      type: "array",
      items: {
        type: "object",
        required: ["url", "label", "type"],
        properties: {
          url: { type: "string", format: "uri" },
          label: { type: "string" },
          type: {
            type: "string",
            enum: ["primary", "reference", "discussion"],
          },
        },
      },
    },
    suggested_commentary_angle: { type: "string" },
  },
} as const;

export function buildUserPrompt(input: CandidateDraftInput): string {
  const lines = [
    "Bookmarks (one or more URLs that may be about the same story):",
    "",
    ...input.bookmarks.map(
      (b, i) =>
        `[${i + 1}] ${b.url}` +
        (b.sourceAuthor ? ` (via ${b.sourceAuthor})` : "") +
        (b.rawContent ? `\nExcerpt: ${b.rawContent.slice(0, 800)}` : ""),
    ),
    "",
    "Produce one JSON object describing this story as a candidate item.",
  ];
  return lines.join("\n");
}

export const PROMPT_VERSION = "v1";
