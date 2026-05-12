import { redirect } from "next/navigation";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { CmsBriefEditor } from "@/components/cms-brief-editor";

export const dynamic = "force-dynamic";

function nextWeekday(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  do {
    d.setUTCDate(d.getUTCDate() + 1);
  } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().slice(0, 10);
}

export default async function CmsTodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: maybe } = await searchParams;
  const targetDate = maybe ?? nextWeekday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) redirect("/cms");
  const candidates = await convexClient().query(api.candidates.listByDate, {
    targetDate,
  });
  const brief = await convexClient().query(api.briefs.getByDate, {
    date: targetDate,
  });
  return (
    <main className="py-6">
      <CmsBriefEditor
        targetDate={targetDate}
        candidates={candidates.map((c) => ({
          id: c._id,
          title: c.title,
          summary: c.summary,
          commentary: c.commentary,
          category: c.category,
          tags: c.tags,
          importance: c.importance,
          decision: c.decision,
          links: c.links,
          source: c.source,
          position: c.position,
          readingTimeSeconds: c.readingTimeSeconds,
        }))}
        editorNote={brief?.editorNote ?? ""}
        edition={brief?.edition}
        status={brief?.status ?? "draft"}
      />
    </main>
  );
}
