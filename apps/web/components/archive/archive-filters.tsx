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
