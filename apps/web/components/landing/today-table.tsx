import Link from "next/link";
import type { Brief } from "@the-pull/schema";
import { AsciiRule, MetaChip } from "@/components/terminal";

interface Props {
  brief: Brief | null;
}

const FREE_ROWS = 4;

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

export function TodayTable({ brief }: Props) {
  return (
    <section className="max-w-[var(--w-grid)] mx-auto px-6 pb-20">
      <AsciiRule label="today's brief" number="01" />
      <div className="mt-6">
        {brief ? (
          <>
            <p className="font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)] mb-4">
              edition #{String(brief.edition).padStart(3, "0")} · {brief.date} ·{" "}
              {brief.items.length} items
            </p>
            <div className="rounded-lg border border-[color:var(--color-rule)] overflow-hidden">
              <div className="grid grid-cols-[3rem_8rem_8rem_1fr] gap-x-4 px-4 py-2 border-b border-[color:var(--color-rule)] bg-[color:var(--color-mantle)] font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay1)]">
                <span>#</span>
                <span>category</span>
                <span>importance</span>
                <span>title</span>
              </div>
              <ul>
                {brief.items.map((item, i) => {
                  const gated = i >= FREE_ROWS;
                  return (
                    <li
                      key={item.id}
                      className={
                        "grid grid-cols-[3rem_8rem_8rem_1fr] gap-x-4 px-4 py-2.5 items-center border-b border-[color:var(--color-rule)] last:border-b-0 " +
                        (gated ? "relative" : "")
                      }
                      style={
                        gated
                          ? {
                              maskImage:
                                "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.15))",
                              WebkitMaskImage:
                                "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.15))",
                            }
                          : undefined
                      }
                    >
                      <span className="font-mono text-[var(--text-caption)] tabular-nums text-[color:var(--color-overlay1)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <MetaChip label={item.category} />
                      <MetaChip label={item.importance} bar={importanceToBar(item.importance)} />
                      <span className="text-[var(--text-body-sm)] text-[color:var(--color-text)] truncate">
                        {item.title}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {brief.items.length > FREE_ROWS && (
                <div className="px-4 py-4 bg-[color:color-mix(in_oklab,var(--color-mauve)_8%,transparent)] border-t border-[color:var(--color-rule)] flex items-center justify-between gap-4">
                  <span className="font-mono text-[var(--text-caption)] text-[color:var(--color-subtext1)]">
                    + {brief.items.length - FREE_ROWS} more — subscribe to read.
                  </span>
                  <Link
                    href="#email"
                    className="px-3 py-1.5 rounded-md bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium text-[var(--text-caption)] no-underline hover:opacity-90"
                  >
                    subscribe →
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
            no editions yet · first one is on the way.
          </p>
        )}
      </div>
    </section>
  );
}
