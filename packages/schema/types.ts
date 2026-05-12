// Public API contract for The Pull (v1).
// Mirror of v1.json. Keep both in sync.

export const SCHEMA_VERSION = "1.0" as const;

export type Category =
  | "model"
  | "tool"
  | "protocol"
  | "research"
  | "business"
  | "meta";

export type Importance = "low" | "medium" | "high";

export type LinkType = "primary" | "reference" | "discussion";

export interface BriefLink {
  url: string;
  label: string;
  type: LinkType;
}

export interface BriefSource {
  type: string;
  url: string;
  author?: string;
}

export interface BriefItem {
  /** YYYY-MM-DD-NN, permanent and globally unique. */
  id: string;
  title: string;
  /** Objective neutral summary. Omitted in preview. */
  summary?: string;
  /** Editorial voice. Omitted in preview. */
  commentary?: string;
  category: Category;
  tags?: string[];
  /** Omitted in preview. */
  links?: BriefLink[];
  /** Omitted in preview. */
  source?: BriefSource;
  importance: Importance;
  reading_time_seconds?: number;
}

export interface BriefStats {
  item_count: number;
  total_reading_time_seconds?: number;
}

/** Full authenticated brief. */
export interface Brief {
  /** Schema version, e.g. "1.0". */
  version: string;
  /** YYYY-MM-DD publish date. */
  date: string;
  edition: number;
  /** ISO 8601 UTC. */
  published_at: string;
  preview?: false;
  editor_note?: string;
  items: BriefItem[];
  stats: BriefStats;
}

/** Preview shape for unauthenticated callers. */
export interface BriefPreview {
  version: string;
  date: string;
  edition: number;
  published_at: string;
  preview: true;
  items: Array<
    Pick<BriefItem, "id" | "title" | "category" | "importance"> & {
      tags?: string[];
    }
  >;
  stats: BriefStats;
}

export type BriefResponse = Brief | BriefPreview;

export function isPreview(brief: BriefResponse): brief is BriefPreview {
  return (brief as BriefPreview).preview === true;
}

/** Strip a full brief down to the preview shape. */
export function toPreview(brief: Brief): BriefPreview {
  return {
    version: brief.version,
    date: brief.date,
    edition: brief.edition,
    published_at: brief.published_at,
    preview: true,
    items: brief.items.map(({ id, title, category, importance, tags }) => ({
      id,
      title,
      category,
      importance,
      tags,
    })),
    stats: brief.stats,
  };
}

/** Stable item id: YYYY-MM-DD-NN. NN is 1-based, zero-padded to 2 digits. */
export function buildItemId(date: string, position: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date: ${date}`);
  }
  if (!Number.isInteger(position) || position < 1 || position > 99) {
    throw new Error(`Invalid position: ${position}`);
  }
  return `${date}-${String(position).padStart(2, "0")}`;
}
