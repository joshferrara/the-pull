import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Read a Cloudflare binding (R2/KV/Email) from the Worker env at runtime. */
export function bindings() {
  const { env } = getCloudflareContext();
  return env as unknown as CloudflareEnv;
}

export function siteUrl(): string {
  return process.env.SITE_URL ?? "https://thepull.dev";
}
