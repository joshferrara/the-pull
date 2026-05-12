import { NextRequest, NextResponse } from "next/server";
import { getBriefJson } from "@/lib/r2";
import {
  emailProvider,
  dailyBriefEmail,
  renderDailyBriefHtml,
} from "@/lib/email";
import { signWebToken } from "@/lib/auth";
import { siteUrl } from "@/lib/env";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-internal-secret") !== process.env.CMS_AUTH_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await req.json()) as {
    briefDate: string;
    recipients: Array<{ id: string; email: string }>;
    plainText: string;
  };
  const brief = await getBriefJson(body.briefDate);
  if (!brief) {
    return NextResponse.json({ error: "no_brief" }, { status: 404 });
  }

  let sent = 0;
  let failed = 0;
  const provider = emailProvider();
  const base = siteUrl();
  const webUrl = `${base}/brief/${body.briefDate}`;
  for (const u of body.recipients) {
    try {
      const unsubToken = await signWebToken({
        userId: u.id as never,
        briefDate: body.briefDate,
        ttlMs: 1000 * 60 * 60 * 24 * 365,
      });
      const unsubUrl = `${base}/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
      // Spec 5.11/5.12: each recipient gets a personalized HTML body
      // (different unsub URL → different rendered HTML) built from the
      // React Email template.
      const html = await renderDailyBriefHtml({ brief, webUrl, unsubscribeUrl: unsubUrl });
      await provider.send(
        dailyBriefEmail({
          email: u.email,
          edition: brief.edition,
          date: body.briefDate,
          html,
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
