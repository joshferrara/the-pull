import { NextRequest, NextResponse } from "next/server";
import { putBriefArtifacts } from "@/lib/r2";


/**
 * Internal endpoint called by Convex `publish.uploadArtifactsToR2` to push
 * rendered brief artifacts into R2 (which Convex itself cannot bind to).
 * Authenticated by a shared HMAC secret (`x-internal-secret`).
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.CMS_AUTH_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: {
    keys: { jsonR2Key: string };
    json: string;
    markdown: string;
    html: string;
    rss: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  // jsonR2Key is "briefs/YYYY-MM-DD/brief.json" — extract date.
  const m = body.keys.jsonR2Key.match(/^briefs\/(\d{4}-\d{2}-\d{2})\//);
  if (!m)
    return NextResponse.json({ error: "bad_key_format" }, { status: 400 });
  await putBriefArtifacts({
    date: m[1],
    json: body.json,
    markdown: body.markdown,
    html: body.html,
    rss: body.rss,
  });
  return NextResponse.json({ ok: true });
}
