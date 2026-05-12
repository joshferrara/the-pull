import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json()) as { timezone?: string };
  if (!body.timezone) {
    return NextResponse.json({ error: "timezone_required" }, { status: 400 });
  }
  await convexClient().mutation(api.users.setTimezone, {
    userId: session.userId,
    timezone: body.timezone,
  });
  return NextResponse.json({ ok: true });
}
