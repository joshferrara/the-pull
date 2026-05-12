import { NextRequest, NextResponse } from "next/server";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { emailProvider, magicLinkEmail } from "@/lib/email";


export async function POST(req: NextRequest) {
  let body: { email?: string; source?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const existing = await convexClient().query(api.auth.getUserByEmail, {
    email,
  });
  const { code } = await convexClient().mutation(api.auth.createAuthCode, {
    email,
    purpose: existing ? "login" : "signup",
  });
  try {
    await emailProvider().send(
      magicLinkEmail({ email, code, callbackPath: body.next }),
    );
  } catch (err) {
    console.error("magic link send failed", err);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
