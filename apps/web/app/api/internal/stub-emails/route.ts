import { NextRequest, NextResponse } from "next/server";
import { bindings } from "@/lib/env";

/**
 * Debug endpoint: when EMAIL_PROVIDER=stub, returns the most-recent captured
 * email sends. Gated by the same shared HMAC secret used by Convex → Worker
 * internal calls so it is not publicly readable.
 */
export async function GET(req: NextRequest) {
  if (req.headers.get("x-internal-secret") !== process.env.CMS_AUTH_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const env = bindings();
  // Cloudflare KV's list() returns up to 1000 keys per call; that's plenty.
  // Cast since the local stub type only models get/put/delete.
  const kv = env.TOKENS_KV as unknown as {
    list(opts: { prefix: string }): Promise<{
      keys: Array<{ name: string }>;
    }>;
  };
  const list = await kv.list({ prefix: "stub_email:" });
  const captured = await Promise.all(
    list.keys.map(async (k) =>
      env.TOKENS_KV.get<{
        id: string;
        to: string;
        subject: string;
        text: string;
        html_chars: number;
        captured_at: string;
      }>(k.name, "json"),
    ),
  );
  const resolved = captured
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.captured_at.localeCompare(a.captured_at));
  return NextResponse.json({ count: resolved.length, raw_keys: list.keys.length, emails: resolved });
}

/** Clear all captured stub emails. */
export async function DELETE(req: NextRequest) {
  if (req.headers.get("x-internal-secret") !== process.env.CMS_AUTH_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const env = bindings();
  const kv = env.TOKENS_KV as unknown as {
    list(opts: { prefix: string }): Promise<{
      keys: Array<{ name: string }>;
    }>;
  };
  const list = await kv.list({ prefix: "stub_email:" });
  for (const k of list.keys) await env.TOKENS_KV.delete(k.name);
  return NextResponse.json({ cleared: list.keys.length });
}
