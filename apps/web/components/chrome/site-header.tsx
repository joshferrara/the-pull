import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-rule)] backdrop-blur-md bg-[color:color-mix(in_oklab,var(--color-base)_85%,transparent)]">
      <div className="max-w-[var(--w-grid)] mx-auto px-6 h-14 flex items-center gap-6">
        <Link
          href="/"
          className="font-mono text-[var(--text-body-sm)] text-[color:var(--color-text)] no-underline"
          aria-label="The Pull, home"
        >
          <span className="text-[color:var(--color-overlay1)]">[</span>
          <span className="px-1">the pull</span>
          <span className="text-[color:var(--color-overlay1)]">]</span>
        </Link>
        <nav className="ml-auto flex items-center gap-5 font-mono text-[var(--text-caption)]">
          <Link
            href="/archive"
            className="text-[color:var(--color-overlay1)] hover:text-[color:var(--color-mauve)] no-underline"
          >
            archive
          </Link>
          <Link
            href="/brief/latest"
            className="text-[color:var(--color-overlay1)] hover:text-[color:var(--color-mauve)] no-underline"
          >
            today
          </Link>
          <Link
            href="/#email"
            className="text-[color:var(--color-mauve)] no-underline"
          >
            subscribe
          </Link>
        </nav>
      </div>
    </header>
  );
}
