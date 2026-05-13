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
