import { NextRequest, NextResponse } from "next/server";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { createSession, isCmsEmail } from "@/lib/auth";


export async function POST(req: NextRequest) {
  let body: { code?: string; cli_callback?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.code)
    return NextResponse.json({ error: "code_required" }, { status: 400 });
  const consumed = await convexClient().mutation(api.auth.consumeAuthCode, {
    code: body.code,
  });
  if (!consumed.ok) {
    return NextResponse.json({ error: consumed.reason }, { status: 400 });
  }
  const userId = await convexClient().mutation(api.users.upsertVerified, {
    email: consumed.email,
  });
  // Create a default CLI token for first-time verifiers.
  const { token } = await convexClient().mutation(api.tokens.create, {
    userId,
    scope: "cli",
    label: "default",
  });
  if (!body.cli_callback) {
    await createSession({ userId, email: consumed.email });
  }
  return NextResponse.json({
    ok: true,
    email: consumed.email,
    user_id: userId,
    token,
    cms_eligible: isCmsEmail(consumed.email),
  });
}
