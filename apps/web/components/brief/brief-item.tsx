import type { BriefItem as BriefItemType, BriefPreview } from "@the-pull/schema";
import { AsciiRule, MetaChip } from "@/components/terminal";

type PreviewItem = BriefPreview["items"][number];

interface Props {
  item: BriefItemType | PreviewItem;
  index: number;
  isLast: boolean;
  isPreview: boolean;
}

function importanceToBar(value: string): number {
  switch (value) {
    case "high":
      return 1.0;
    case "medium":
      return 0.6;
    case "low":
      return 0.3;
    default:
      return 0.5;
  }
}

function readMinutes(item: BriefItemType): number | null {
  if (typeof item.reading_time_seconds === "number" && item.reading_time_seconds > 0) {
    return Math.max(1, Math.round(item.reading_time_seconds / 60));
  }
  const text = (item.summary ?? "") + " " + (item.commentary ?? "");
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words === 0) return null;
  return Math.max(1, Math.round(words / 200));
}

export function BriefItem({ item, index, isLast, isPreview }: Props) {
  const fullItem = !isPreview ? (item as BriefItemType) : null;
  const minutes = fullItem ? readMinutes(fullItem) : null;
  return (
    <li id={`item-${index + 1}`} className="brief-prose scroll-mt-24">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <MetaChip label={item.category} />
        <MetaChip label={item.importance} bar={importanceToBar(item.importance)} />
        {minutes !== null && (
          <span className="ml-auto font-mono text-[var(--text-micro)] text-[color:var(--color-overlay1)]">
            {minutes} min read
          </span>
        )}
      </div>
      <h2 className="text-[var(--text-h2)] font-semibold text-[color:var(--color-text)] leading-snug">
        {item.title}
      </h2>
      {fullItem?.summary && <p>{fullItem.summary}</p>}
      {fullItem?.commentary && <blockquote>{fullItem.commentary}</blockquote>}
      {fullItem?.links && fullItem.links.length > 0 && (
        <div className="mt-5">
          <div className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay1)] mb-2">
            sources
          </div>
          <ul className="font-mono text-[var(--text-caption)]">
            {fullItem.links.map((link) => (
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
