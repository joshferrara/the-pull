import Link from "next/link";
import { TerminalPane } from "@/components/terminal";

export function ArchiveEmpty() {
  return (
    <div className="mt-6 max-w-[var(--w-wide)]">
      <TerminalPane title="bash — empty">
        <pre className="p-5 whitespace-pre-wrap leading-relaxed text-[color:var(--color-text)]">
          <span className="text-[color:var(--color-prompt)]">$</span> ls briefs/{"\n"}
          <span className="text-[color:var(--color-overlay1)]">ls: briefs/: no files yet.</span>
          {"\n\n"}
          Hint: the first edition is around the corner.{"\n"}
          Subscribe and I&apos;ll let you know.
        </pre>
        <div className="border-t border-[color:var(--color-surface1)] px-4 py-3">
          <Link
            href="/#email"
            className="inline-block px-3 py-1.5 rounded-md bg-[color:var(--color-mauve)] text-[color:var(--color-crust)] font-medium text-[var(--text-caption)] no-underline"
          >
            subscribe →
          </Link>
        </div>
      </TerminalPane>
    </div>
  );
}
