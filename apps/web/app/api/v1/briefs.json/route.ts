import { NextRequest, NextResponse } from "next/server";
import { authenticateBearer, checkRateLimit } from "@/lib/tokens";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


export async function GET(req: NextRequest) {
  const auth = await authenticateBearer(req);
  if (!auth)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rl = await checkRateLimit(auth.token.token, auth.token.scope);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limit_exceeded" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }
  const limit = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("limit") ?? "30", 10), 1),
    365,
  );
  const briefs = await convexClient().query(api.briefs.listPublished, {
    limit,
  });
  return NextResponse.json({
    briefs: briefs.map((b) => ({
      date: b.date,
      edition: b.edition,
      published_at: b.publishedAt
        ? new Date(b.publishedAt).toISOString()
        : null,
      item_count: b.itemCount,
      total_reading_time_seconds: b.totalReadingTimeSeconds,
    })),
  });
}
