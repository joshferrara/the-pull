// Generated/edited shape of the Worker env bindings. Run `pnpm cf-typegen` to refresh.
// This minimal stub keeps the type-checker happy until wrangler types regenerates.

interface CloudflareEnv {
  ASSETS: Fetcher;
  BRIEFS_BUCKET: R2Bucket;
  NEXT_INC_CACHE_R2_BUCKET?: R2Bucket;
  TOKENS_KV: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
  EMAIL: SendEmail;
  CMS_EMAIL: string;
  EMAIL_PROVIDER: "cloudflare" | "resend";
  SITE_URL: string;
  // Secrets
  CONVEX_URL: string;
  CONVEX_DEPLOY_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  TWITTER_BEARER_TOKEN?: string;
  CMS_AUTH_SECRET: string;
  RESEND_API_KEY?: string;
}

// Minimal types so this file is self-contained until wrangler types regenerates.
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
}
interface R2ObjectBody {
  body: ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  httpMetadata?: { contentType?: string; cacheControl?: string };
}
interface KVNamespace {
  get(key: string): Promise<string | null>;
  get<T>(key: string, type: "json"): Promise<T | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; expiration?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
}
interface SendEmail {
  send(message: EmailMessage): Promise<void>;
}
interface EmailMessage {
  from: string;
  to: string;
  raw: ReadableStream | string;
}
interface Fetcher {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}
