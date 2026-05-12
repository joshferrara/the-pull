import { ConvexHttpClient } from "convex/browser";

let cached: ConvexHttpClient | null = null;

/** Server-side Convex client. Uses CONVEX_URL from env. */
export function convexClient(): ConvexHttpClient {
  if (cached) return cached;
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("CONVEX_URL is not set");
  cached = new ConvexHttpClient(url);
  return cached;
}
