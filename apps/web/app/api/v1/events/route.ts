import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { authenticateBearer, sessionHash } from "@/lib/tokens";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


interface EventInput {
  type: string;
  brief_date?: string;
  item_id?: string;
  channel: string;
}

const ALLOWED_TYPES = new Set([
  "brief_view",
  "item_save",
  "item_link_click",
  "tui_launch",
  "api_fetch",
  "rss_fetch",
]);

const ALLOWED_CHANNELS = new Set([
  "tui",
  "cli",
  "api",
  "rss",
  "email",
  "web",
]);

export async function POST(req: NextRequest) {
  const auth = await authenticateBearer(req);
  if (!auth)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (auth.user.preferences.analyticsOptOut) {
    return new Response(null, { status: 204 });
  }
  let body: EventInput | EventInput[];
  try {
    body = (await req.json()) as EventInput | EventInput[];
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const items = Array.isArray(body) ? body : [body];
  const hash = await sessionHash(auth.token.token, auth.user.timezone);
  const events = items
    .filter(
      (e) =>
        ALLOWED_TYPES.has(e.type) && ALLOWED_CHANNELS.has(e.channel),
    )
    .map((e) => ({
      type: e.type as
        | "brief_view"
        | "item_save"
        | "item_link_click"
        | "tui_launch"
        | "api_fetch"
        | "rss_fetch",
      briefDate: e.brief_date,
      itemId: e.item_id as never,
      channel: e.channel as
        | "tui"
        | "cli"
        | "api"
        | "rss"
        | "email"
        | "web",
      sessionHash: hash,
      timestamp: Date.now(),
    }));
  if (events.length === 0) return new Response(null, { status: 204 });
  // Don't make the client wait, but keep the Worker alive long enough to
  // actually deliver the mutation. `after()` is the Workers-safe equivalent
  // of `ctx.waitUntil(promise)` in this Next.js route.
  after(async () => {
    try {
      await convexClient().mutation(api.events.insertBatch, { events });
    } catch (err) {
      console.error("event insert failed", err);
    }
  });
  return new Response(null, { status: 204 });
}
