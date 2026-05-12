import { NextRequest, NextResponse } from "next/server";
import { getBriefArtifact } from "@/lib/r2";
import { emailProvider, dailyBriefEmail } from "@/lib/email";
import { signWebToken } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


export async function POST(req: NextRequest) {
  if (req.headers.get("x-internal-secret") !== process.env.CMS_AUTH_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as {
    briefDate: string;
    recipients: Array<{ id: string; email: string }>;
    plainText: string;
  };
  const html = await getBriefArtifact(body.briefDate, "html");
  if (!html)
    return NextResponse.json({ error: "no_html" }, { status: 500 });
  const brief = await convexClient().query(api.briefs.getByDate, {
    date: body.briefDate,
  });
  if (!brief)
    return NextResponse.json({ error: "no_brief" }, { status: 404 });

  let sent = 0;
  let failed = 0;
  const provider = emailProvider();
  const base = siteUrl();
  for (const u of body.recipients) {
    try {
      const unsubToken = await signWebToken({
        userId: u.id as never,
        briefDate: body.briefDate,
        ttlMs: 1000 * 60 * 60 * 24 * 365,
      });
      const unsubUrl = `${base}/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
      await provider.send(
        dailyBriefEmail({
          email: u.email,
          edition: brief.edition,
          date: body.briefDate,
          html: html.body,
          text: body.plainText,
          unsubscribeUrl: unsubUrl,
        }),
      );
      sent++;
    } catch (err) {
      failed++;
      console.error("send fail", u.email, err);
    }
  }
  return NextResponse.json({ sent, failed });
}
