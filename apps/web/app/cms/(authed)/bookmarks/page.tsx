import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { BookmarksClient } from "@/components/bookmarks-client";

export const dynamic = "force-dynamic";


export default async function CmsBookmarksPage() {
  const pending = await convexClient().query(api.bookmarks.listPending);
  return (
    <main className="py-6">
      <h1 className="text-xl font-bold mb-1">Bookmark inbox</h1>
      <p className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)] mb-4">
        {pending.length} pending
      </p>
      <BookmarksClient
        pending={pending.map((b) => ({
          id: b._id,
          url: b.url,
          sourceUrl: b.sourceUrl,
          sourceType: b.sourceType,
          sourceAuthor: b.sourceAuthor,
          rawContent: b.rawContent,
          capturedAt: new Date(b.capturedAt).toISOString(),
        }))}
      />
    </main>
  );
}
