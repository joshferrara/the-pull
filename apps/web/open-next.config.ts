import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Incremental cache: defaults to in-memory until R2 is enabled in the account.
// Once R2 is enabled (Dashboard → R2 → Enable) and the bucket is created
// (`wrangler r2 bucket create the-pull-next-cache`), switch the import to:
//   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
// and pass `incrementalCache: r2IncrementalCache` here.

export default defineCloudflareConfig({});
