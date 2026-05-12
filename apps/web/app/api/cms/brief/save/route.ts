import { NextRequest, NextResponse } from "next/server";
import { requireCmsSession } from "@/lib/cms-guard";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


/** Save the brief draft, schedule for 6 AM ET, or publish immediately. */
export async function POST(req: NextRequest) {
  try {
    await requireCmsSession();
  } catch (resp) {
    return resp as Response;
  }
  const body = (await req.json()) as {
    date?: string;
    editorNote?: string;
    itemIds?: string[];
    publishNow?: boolean;
  };
  if (!body.date || !body.itemIds)
    return NextResponse.json({ error: "bad_request" }, { status: 400 });

  // Persist positions in the kept order.
  await convexClient().mutation(api.candidates.reorderKept, {
    targetDate: body.date,
    orderedIds: body.itemIds as unknown as never[],
  });

  const briefId = await convexClient().mutation(api.briefs.upsertDraft, {
    date: body.date,
    editorNote: body.editorNote,
    itemIds: body.itemIds as unknown as never[],
  });

  if (body.publishNow) {
    const result = await convexClient().action(api.publish.publishBrief, {
      date: body.date,
    });
    return NextResponse.json({ ok: true, published: result });
  }

  // Schedule for 6 AM ET of the target date.
  const [y, m, d] = body.date.split("-").map(Number);
  const sixAmEt = new Date(Date.UTC(y, m - 1, d, 11, 0, 0));
  await convexClient().mutation(api.briefs.schedule, {
    briefId,
    scheduledFor: sixAmEt.getTime(),
  });
  return NextResponse.json({ ok: true, scheduled: sixAmEt.toISOString() });
}
