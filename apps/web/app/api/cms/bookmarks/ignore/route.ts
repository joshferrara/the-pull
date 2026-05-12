import { NextRequest, NextResponse } from "next/server";
import { requireCmsSession } from "@/lib/cms-guard";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    await requireCmsSession();
  } catch (resp) {
    return resp as Response;
  }
  const body = (await req.json()) as { bookmarkId?: string };
  if (!body.bookmarkId) {
    return NextResponse.json({ error: "bookmarkId_required" }, { status: 400 });
  }
  await convexClient().mutation(api.bookmarks.ignore, {
    bookmarkId: body.bookmarkId as never,
  });
  return NextResponse.json({ ok: true });
}
