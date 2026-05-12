import Link from "next/link";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";


export default async function CmsArchivePage() {
  const briefs = await convexClient().query(api.briefs.listPublished, {
    limit: 365,
  });
  return (
    <main className="py-6">
      <h1 className="text-xl font-bold mb-4">Archive</h1>
      <ul className="divide-y divide-[color:var(--color-surface1)]">
        {briefs.map((b) => (
          <li key={b._id} className="py-2 flex gap-4 items-baseline text-sm">
            <span className="font-mono text-xs text-[color:var(--color-overlay0)] w-12">
              #{b.edition}
            </span>
            <Link href={`/cms?date=${b.date}`} className="text-[color:var(--color-text)]">
              {b.date}
            </Link>
            <span className="ml-auto text-xs text-[color:var(--color-overlay1)]">
              {b.itemCount ?? 0} items
            </span>
          </li>
        ))}
        {briefs.length === 0 && (
          <li className="py-4 text-[color:var(--color-overlay1)]">No editions yet.</li>
        )}
      </ul>
    </main>
  );
}
