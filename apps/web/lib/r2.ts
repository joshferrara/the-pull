import { bindings } from "./env";
import type { Brief } from "@the-pull/schema";

const CACHE_PUBLIC = "public, max-age=300, s-maxage=86400, stale-while-revalidate=86400";

export async function getBriefJson(date: string): Promise<Brief | null> {
  const env = bindings();
  const obj = await env.BRIEFS_BUCKET.get(`briefs/${date}/brief.json`);
  if (!obj) return null;
  return (await obj.json()) as Brief;
}

export async function getBriefArtifact(
  date: string,
  ext: "json" | "md" | "html" | "xml",
): Promise<{ body: string; contentType: string } | null> {
  const env = bindings();
  const map: Record<typeof ext, { name: string; ct: string }> = {
    json: { name: "brief.json", ct: "application/json" },
    md: { name: "brief.md", ct: "text/markdown; charset=utf-8" },
    html: { name: "brief.html", ct: "text/html; charset=utf-8" },
    xml: { name: "feed.xml", ct: "application/rss+xml; charset=utf-8" },
  };
  const { name, ct } = map[ext];
  const obj = await env.BRIEFS_BUCKET.get(`briefs/${date}/${name}`);
  if (!obj) return null;
  return { body: await obj.text(), contentType: ct };
}

export async function putBriefArtifacts(args: {
  date: string;
  json: string;
  markdown: string;
  html: string;
  rss: string;
}) {
  const env = bindings();
  await Promise.all([
    env.BRIEFS_BUCKET.put(`briefs/${args.date}/brief.json`, args.json, {
      httpMetadata: { contentType: "application/json", cacheControl: CACHE_PUBLIC },
    }),
    env.BRIEFS_BUCKET.put(`briefs/${args.date}/brief.md`, args.markdown, {
      httpMetadata: {
        contentType: "text/markdown; charset=utf-8",
        cacheControl: CACHE_PUBLIC,
      },
    }),
    env.BRIEFS_BUCKET.put(`briefs/${args.date}/brief.html`, args.html, {
      httpMetadata: {
        contentType: "text/html; charset=utf-8",
        cacheControl: CACHE_PUBLIC,
      },
    }),
    env.BRIEFS_BUCKET.put(`briefs/${args.date}/feed.xml`, args.rss, {
      httpMetadata: {
        contentType: "application/rss+xml; charset=utf-8",
        cacheControl: "public, max-age=900",
      },
    }),
  ]);
}

export const CACHE_HEADER_TODAY = "public, max-age=300, s-maxage=300, stale-while-revalidate=600";
export const CACHE_HEADER_ARCHIVE = CACHE_PUBLIC;
