import { NextRequest, NextResponse } from "next/server";
import { authenticateBearer } from "@/lib/tokens";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { isCmsEmail } from "@/lib/auth";


/** POST a bookmark — share-sheet endpoint. Restricted to the CMS owner. */
export async function POST(req: NextRequest) {
  const auth = await authenticateBearer(req);
  if (!auth || !isCmsEmail(auth.user.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: { url?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.url)
    return NextResponse.json({ error: "url_required" }, { status: 400 });
  const result = await convexClient().mutation(api.bookmarks.insert, {
    url: body.url,
    sourceType: "share_sheet",
    rawContent: body.note,
  });
  return NextResponse.json(result);
}
