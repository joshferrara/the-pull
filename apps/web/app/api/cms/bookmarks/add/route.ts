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
  const body = (await req.json()) as { url?: string; note?: string };
  if (!body.url)
    return NextResponse.json({ error: "url_required" }, { status: 400 });
  const r = await convexClient().mutation(api.bookmarks.insert, {
    url: body.url,
    sourceType: "manual",
    rawContent: body.note,
  });
  return NextResponse.json(r);
}
