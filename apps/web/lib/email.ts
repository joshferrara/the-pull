import { bindings, siteUrl } from "./env";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export interface EmailProvider {
  send(args: EmailPayload): Promise<{ id: string }>;
}

/**
 * Sender address. Override via EMAIL_FROM env var (Worker `vars`). The default
 * uses Resend's onboarding sender which works without a verified domain — fine
 * for pre-launch testing. Once thepull.dev is verified, set this to
 * "The Pull <hello@thepull.dev>".
 */
const FROM = process.env.EMAIL_FROM ?? "The Pull <onboarding@resend.dev>";

/** Cloudflare Email Service via the `EMAIL` worker binding. */
class CloudflareEmailProvider implements EmailProvider {
  async send(args: EmailPayload): Promise<{ id: string }> {
    const env = bindings();
    const raw = buildRfc822({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      headers: args.headers,
    });
    const emailBinding = (env as unknown as { EMAIL?: { send: (msg: { from: string; to: string; raw: string }) => Promise<void> } }).EMAIL;
    if (!emailBinding) {
      throw new Error(
        "EMAIL binding missing. Enable Email Routing on the zone and uncomment send_email in wrangler.jsonc.",
      );
    }
    await emailBinding.send({ from: FROM, to: args.to, raw });
    return { id: crypto.randomUUID() };
  }
}

class ResendEmailProvider implements EmailProvider {
  async send(args: EmailPayload): Promise<{ id: string }> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not set");
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        headers: args.headers,
      }),
    });
    if (!resp.ok) {
      throw new Error(`Resend error ${resp.status}: ${await resp.text()}`);
    }
    const data = (await resp.json()) as { id: string };
    return { id: data.id };
  }
}

/**
 * In-memory `stub` provider: captures every send into Workers KV
 * (`stub:<uuid>` keys) so an internal debug endpoint can read them back. Used
 * for end-to-end validation of the publish→email pipeline before the real
 * Cloudflare Email Service / Resend providers have credentials.
 */
class StubEmailProvider implements EmailProvider {
  async send(args: EmailPayload): Promise<{ id: string }> {
    const env = bindings();
    const id = crypto.randomUUID();
    const record = {
      id,
      to: args.to,
      subject: args.subject,
      text: args.text.slice(0, 2000),
      html_chars: args.html.length,
      headers: args.headers ?? {},
      captured_at: new Date().toISOString(),
    };
    // Reuse TOKENS_KV with a "stub_email:" namespace prefix to avoid adding
    // another binding just for this debug path. 24-hour TTL.
    await env.TOKENS_KV.put(`stub_email:${id}`, JSON.stringify(record), {
      expirationTtl: 24 * 60 * 60,
    });
    return { id };
  }
}

export function emailProvider(): EmailProvider {
  const choice = (process.env.EMAIL_PROVIDER ?? "cloudflare").toLowerCase();
  switch (choice) {
    case "resend":
      return new ResendEmailProvider();
    case "stub":
      return new StubEmailProvider();
    default:
      return new CloudflareEmailProvider();
  }
}

function buildRfc822(args: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}): string {
  const boundary = `bnd_${crypto.randomUUID().replace(/-/g, "")}`;
  const extraHeaders = Object.entries(args.headers ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\r\n");
  return [
    `From: ${args.from}`,
    `To: ${args.to}`,
    `Subject: ${args.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    extraHeaders,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    args.text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    args.html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

/* ----- Templates ----- */

export async function magicLinkEmail(args: {
  email: string;
  code: string;
  callbackPath?: string;
  /** Loopback URL of a waiting CLI listener. The register endpoint validates
   * this is a loopback host before passing it in. */
  cliCallback?: string;
}): Promise<EmailPayload> {
  const base = siteUrl();
  const params = new URLSearchParams({ code: args.code });
  if (args.callbackPath) params.set("next", args.callbackPath);
  if (args.cliCallback) params.set("cli_callback", args.cliCallback);
  const url = `${base}/verify?${params.toString()}`;
  // React Email render is dynamic-imported so it's only loaded in the email
  // send path (the public marketing / API routes shouldn't pay this cost).
  const [{ render }, { MagicLinkEmail }] = await Promise.all([
    import("@react-email/components"),
    import("./email/templates/magic-link"),
  ]);
  const html = await render(
    MagicLinkEmail({ url, code: args.code, expiresInMinutes: 15 }),
  );
  return {
    to: args.email,
    subject: "Your sign-in link for The Pull",
    text: `Click to sign in: ${url}\n\nCode: ${args.code}\n\nLink expires in 15 minutes.`,
    html,
  };
}

/**
 * Render the daily-brief HTML with the React Email template. Used by the
 * publish pipeline when building per-recipient emails.
 */
export async function renderDailyBriefHtml(args: {
  brief: import("@the-pull/schema").Brief;
  webUrl: string;
  unsubscribeUrl: string;
}): Promise<string> {
  const [{ render }, { DailyBriefEmail }] = await Promise.all([
    import("@react-email/components"),
    import("./email/templates/daily-brief"),
  ]);
  return await render(
    DailyBriefEmail({
      brief: args.brief,
      webUrl: args.webUrl,
      unsubscribeUrl: args.unsubscribeUrl,
    }),
  );
}

export function dailyBriefEmail(args: {
  email: string;
  edition: number;
  date: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
}): EmailPayload {
  return {
    to: args.email,
    subject: `The Pull #${args.edition} — ${args.date}`,
    html: args.html,
    text: args.text,
    headers: {
      "List-Unsubscribe": `<${args.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
