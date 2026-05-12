import { NextRequest, NextResponse } from "next/server";
import { authenticateBearer, checkRateLimit } from "@/lib/tokens";
import { getBriefJson, CACHE_HEADER_ARCHIVE } from "@/lib/r2";
import { shapeBrief } from "@/lib/render";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
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
  const brief = await getBriefJson(date);
  if (!brief) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(shapeBrief(brief, !!auth), {
    headers: { "Cache-Control": CACHE_HEADER_ARCHIVE },
  });
}
