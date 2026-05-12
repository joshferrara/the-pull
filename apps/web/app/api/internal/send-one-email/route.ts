import { NextRequest, NextResponse } from "next/server";
import { emailProvider } from "@/lib/email";

/**
 * One-off email sender used by Convex actions (e.g., weekly report) that need
 * to dispatch a single email without a recipient list.
 */
export async function POST(req: NextRequest) {
  if (req.headers.get("x-internal-secret") !== process.env.CMS_AUTH_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as {
    to: string;
    subject: string;
    html: string;
    text: string;
    headers?: Record<string, string>;
  };
  try {
    const r = await emailProvider().send(body);
    return NextResponse.json({ ok: true, id: r.id });
  } catch (err) {
    console.error("send-one-email failed", err);
    return NextResponse.json(
      { error: "send_failed", detail: String(err).slice(0, 500) },
      { status: 500 },
    );
  }
}
