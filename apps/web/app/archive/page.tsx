import Link from "next/link";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const briefs = await convexClient().query(api.briefs.listPublished, {
    limit: 90,
  });

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)]">
          The Pull
        </p>
        <h1 className="text-3xl font-bold mt-2">Archive</h1>
        <p className="mt-3 text-[color:var(--color-subtext0)]">
          Public previews. Subscribe to read full content.
        </p>
      </header>

      {briefs.length === 0 ? (
        <p className="text-[color:var(--color-overlay1)]">
          No editions yet. Check back soon.
        </p>
      ) : (
        <ul className="divide-y divide-[color:var(--color-surface1)]">
          {briefs.map((b) => (
            <li key={b._id} className="py-3">
              <Link
                href={`/brief/${b.date}`}
                className="flex items-baseline gap-4 hover:bg-[color:var(--color-mantle)] -mx-2 px-2 py-1 rounded"
              >
                <span className="text-[color:var(--color-overlay0)] font-mono text-xs w-12">
                  #{b.edition}
                </span>
                <span className="text-[color:var(--color-text)]">{b.date}</span>
                <span className="ml-auto text-xs text-[color:var(--color-overlay1)]">
                  {b.itemCount ?? 0} items
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
