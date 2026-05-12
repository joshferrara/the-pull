/**
 * Augments the wrangler-generated CloudflareEnv with secrets (set via
 * `wrangler secret put`, not declared in wrangler.jsonc).
 */
declare namespace Cloudflare {
  interface Env {
    CMS_AUTH_SECRET: string;
    CONVEX_URL: string;
    ANTHROPIC_API_KEY?: string;
    TWITTER_BEARER_TOKEN?: string;
    TWITTER_USER_ID?: string;
    RESEND_API_KEY?: string;
  }
}
