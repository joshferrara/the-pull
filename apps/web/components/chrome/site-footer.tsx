import Link from "next/link";
import { ScanlineToggle } from "@/components/terminal";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[color:var(--color-rule)]">
      <div className="max-w-[var(--w-grid)] mx-auto px-6 py-12 grid gap-10 md:grid-cols-3 text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
        <div>
          <div className="font-mono text-[color:var(--color-text)]">
            <span className="text-[color:var(--color-overlay1)]">[</span>
            <span className="px-1">the pull</span>
            <span className="text-[color:var(--color-overlay1)]">]</span>
          </div>
          <p className="mt-3 max-w-xs">
            The daily AI brief for developers. 7ish items, weekday mornings,
            delivered where you build.
          </p>
        </div>
        <div>
          <div className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay2)] mb-3">
            the brief
          </div>
          <ul className="space-y-2">
            <li><Link href="/brief/latest" className="no-underline hover:text-[color:var(--color-mauve)]">today</Link></li>
            <li><Link href="/archive" className="no-underline hover:text-[color:var(--color-mauve)]">archive</Link></li>
            <li><a href="/feed.xml" className="no-underline hover:text-[color:var(--color-mauve)]">rss</a></li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay2)] mb-3">
            the project
          </div>
          <ul className="space-y-2">
            <li><a href="https://github.com/joshferrara/the-pull" className="no-underline hover:text-[color:var(--color-mauve)]">github</a></li>
            <li><Link href="/dashboard" className="no-underline hover:text-[color:var(--color-mauve)]">account</Link></li>
            <li><ScanlineToggle /></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[color:var(--color-rule)]">
        <div className="max-w-[var(--w-grid)] mx-auto px-6 py-4 font-mono text-[var(--text-micro)] text-[color:var(--color-overlay0)] flex flex-wrap gap-x-4 gap-y-1">
          <span># ferrara, j. — 2026 · built with ☕ + claude</span>
        </div>
      </div>
    </footer>
  );
}
