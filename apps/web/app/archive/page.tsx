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
            _id: String(b._id),
            date: b.date,
            edition: b.edition,
            itemCount: b.itemCount ?? undefined,
          }))} />
          <ArchiveStats editions={briefs.length} earliest={earliest} />
        </>
      )}

      <StatusBar path="~/archive" />
    </article>
  );
}
