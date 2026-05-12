import type { Id, Doc } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { convexClient } from "./convex";
import { bindings } from "./env";

export interface TokenAuth {
  user: Doc<"users">;
  token: Doc<"tokens">;
}

/** Bearer auth: lookup token in Convex, cache in KV for 5 minutes. */
export async function authenticateBearer(
  req: Request,
): Promise<TokenAuth | null> {
  const header = req.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return await authenticateToken(token);
}

export async function authenticateToken(
  token: string,
): Promise<TokenAuth | null> {
  if (!token || !token.startsWith("tp_")) return null;
  const env = bindings();
  const kvKey = `auth:${token}`;
  const cached = await env.TOKENS_KV.get<TokenAuth>(kvKey, "json");
  if (cached) return cached;
  const result = await convexClient().query(api.tokens.lookup, { token });
  if (!result) return null;
  await env.TOKENS_KV.put(kvKey, JSON.stringify(result), {
    expirationTtl: 300,
  });
  return result;
}

export async function invalidateTokenCache(token: string): Promise<void> {
  const env = bindings();
  await env.TOKENS_KV.delete(`auth:${token}`);
}

/** Per-token-per-day request counter in KV. Returns true if request is allowed. */
export async function checkRateLimit(
  token: string,
  scope: "api" | "rss" | "cli",
): Promise<{ allowed: boolean; retryAfterSeconds: number; count: number }> {
  const env = bindings();
  const day = new Date().toISOString().slice(0, 10);
  const hash = await sha256Hex(token);
  const key = `ratelimit:${hash}:${day}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const current = raw ? parseInt(raw, 10) : 0;
  const next = current + 1;
  const limit = scope === "rss" ? 96 : 200;
  if (current >= limit) {
    const secondsToMidnight = secondsUntilUtcMidnight();
    return { allowed: false, retryAfterSeconds: secondsToMidnight, count: current };
  }
  await env.RATE_LIMIT_KV.put(key, String(next), { expirationTtl: 90000 });
  return { allowed: true, retryAfterSeconds: 0, count: next };
}

async function sha256Hex(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function secondsUntilUtcMidnight(): number {
  const now = Date.now();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(1, Math.floor((midnight.getTime() - now) / 1000));
}

export async function sessionHash(
  token: string,
  userTimezone: string | undefined,
): Promise<string> {
  const tz = userTimezone ?? "UTC";
  const day = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  return sha256Hex(`${token}:${day}`);
}

export type { Id };
