import { NextRequest, NextResponse } from "next/server";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { emailProvider, magicLinkEmail } from "@/lib/email";

/**
 * Validate a CLI callback URL. We will bake this into the magic-link email
 * sent to the user, so it has to be safe — only allow loopback hosts so a
 * malicious caller can't trick a recipient into POSTing their session token
 * to an arbitrary external server.
 */
function safeLoopbackCallback(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return undefined;
  }
  if (u.protocol !== "http:") return undefined;
  const host = u.hostname.toLowerCase();
  const isLoopback =
    host === "127.0.0.1" ||
    host === "localhost" ||
    host === "::1" ||
    host === "[::1]";
  if (!isLoopback) return undefined;
  return u.toString();
}

export async function POST(req: NextRequest) {
  let body: {
    email?: string;
    source?: string;
    next?: string;
    cli_callback?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const cliCallback = safeLoopbackCallback(body.cli_callback);
  const existing = await convexClient().query(api.auth.getUserByEmail, {
    email,
  });
  const { code } = await convexClient().mutation(api.auth.createAuthCode, {
    email,
    purpose: existing ? "login" : "signup",
  });
  try {
    await emailProvider().send(
      await magicLinkEmail({
        email,
        code,
        callbackPath: body.next,
        cliCallback,
      }),
    );
  } catch (err) {
    console.error("magic link send failed", err);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
