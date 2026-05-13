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
