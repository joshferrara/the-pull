import { NextRequest, NextResponse } from "next/server";
import { authenticateBearer, checkRateLimit } from "@/lib/tokens";
import { getBriefJson } from "@/lib/r2";
import { shapeBrief } from "@/lib/render";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { CACHE_HEADER_TODAY } from "@/lib/r2";


export async function GET(req: NextRequest) {
  const auth = await authenticateBearer(req);
  if (auth) {
    const rl = await checkRateLimit(auth.token.token, auth.token.scope);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "rate_limit_exceeded" },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSeconds) },
        },
      );
    }
  }
  const latest = await convexClient().query(api.briefs.getLatestPublished);
  if (!latest) {
    return NextResponse.json({ error: "no_published_brief" }, { status: 404 });
  }
  const brief = await getBriefJson(latest.date);
  if (!brief) {
    return NextResponse.json({ error: "artifact_missing" }, { status: 500 });
  }
  const shaped = shapeBrief(brief, !!auth);
  return NextResponse.json(shaped, {
    headers: { "Cache-Control": auth ? CACHE_HEADER_TODAY : "public, max-age=120" },
  });
}
