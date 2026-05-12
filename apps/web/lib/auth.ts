import { cookies } from "next/headers";
import type { Id } from "@/convex/_generated/dataModel";

const COOKIE_NAME = "tp_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

interface SessionPayload {
  userId: Id<"users">;
  email: string;
  iat: number;
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return b64url(new Uint8Array(sig));
}

function b64url(buf: Uint8Array): string {
  let s = "";
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlEncode(s: string): string {
  return b64url(new TextEncoder().encode(s));
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const normal = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normal);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export async function createSession(payload: Omit<SessionPayload, "iat">) {
  const secret = process.env.CMS_AUTH_SECRET;
  if (!secret) throw new Error("CMS_AUTH_SECRET not set");
  const body: SessionPayload = { ...payload, iat: Date.now() };
  const data = b64urlEncode(JSON.stringify(body));
  const sig = await hmac(secret, data);
  const value = `${data}.${sig}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const secret = process.env.CMS_AUTH_SECRET;
  if (!secret) return null;
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [data, sig] = raw.split(".");
  if (!data || !sig) return null;
  const expected = await hmac(secret, data);
  if (expected !== sig) return null;
  try {
    return JSON.parse(b64urlDecode(data)) as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Signed short-lived URL token (used by TUI `w` keybind to share full content). */
export async function signWebToken(args: {
  userId: Id<"users">;
  briefDate: string;
  ttlMs?: number;
}): Promise<string> {
  const secret = process.env.CMS_AUTH_SECRET;
  if (!secret) throw new Error("CMS_AUTH_SECRET not set");
  const ttl = args.ttlMs ?? 24 * 60 * 60 * 1000;
  const payload = {
    u: args.userId,
    d: args.briefDate,
    e: Date.now() + ttl,
  };
  const data = b64urlEncode(JSON.stringify(payload));
  const sig = await hmac(secret, data);
  return `${data}.${sig}`;
}

export async function verifyWebToken(
  token: string,
): Promise<{ userId: Id<"users">; briefDate: string } | null> {
  const secret = process.env.CMS_AUTH_SECRET;
  if (!secret) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = await hmac(secret, data);
  if (expected !== sig) return null;
  try {
    const payload = JSON.parse(b64urlDecode(data)) as {
      u: Id<"users">;
      d: string;
      e: number;
    };
    if (payload.e < Date.now()) return null;
    return { userId: payload.u, briefDate: payload.d };
  } catch {
    return null;
  }
}

export function isCmsEmail(email: string): boolean {
  const cms = (process.env.CMS_EMAIL ?? "").trim().toLowerCase();
  return cms.length > 0 && cms === email.trim().toLowerCase();
}
