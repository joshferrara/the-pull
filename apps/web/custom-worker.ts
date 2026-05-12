// @ts-nocheck — the `./.open-next/worker.js` import is generated at build time
// by OpenNext, after Next.js has already typechecked. Skipping tsc on this
// single entry file avoids a chicken-and-egg error during pre-build typecheck.
/**
 * Custom Worker entry that re-exports the OpenNext fetch handler and adds a
 * scheduled() handler for Cloudflare Cron Triggers per spec section 5.13.
 *
 * The actual work runs in Convex actions; the scheduled handler is a thin
 * dispatcher that picks the right Convex action by cron expression.
 */

// @ts-ignore `.open-next/worker.ts` is generated at build time
import { default as handler } from "./.open-next/worker.js";

// Re-export the Durable Objects that OpenNext's runtime ships with so they
// stay reachable from the wrangler config.
// @ts-ignore `.open-next/worker.ts` is generated at build time
export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "./.open-next/worker.js";

interface ConvexFn {
  module: string;
  fn: string;
  /** Use false for public actions, true for internal ones. */
  internal?: boolean;
}

/**
 * Map cron expressions (matching wrangler.jsonc `triggers.crons`) to the
 * Convex action they trigger.
 */
const CRON_MAP: Record<string, ConvexFn> = {
  // 9 PM Central — nightly bookmark sync + agent draft.
  "0 2 * * 1-5": { module: "crons_actions", fn: "nightlyPipeline", internal: true },
  // 6 AM ET — publish the scheduled brief and send emails.
  "0 11 * * 1-5": { module: "publish", fn: "publishScheduledBrief", internal: true },
  // 7 AM ET — yesterday's stats rollup.
  "0 12 * * 1-5": { module: "crons_actions", fn: "dailyRollup", internal: true },
  // Daily — auth code cleanup (mutation, but exposed via Convex's own cron).
  // Kept here as a redundant safety net.
  "0 0 * * *": { module: "auth", fn: "cleanupExpiredCodes", internal: true },
  // Sunday midnight — weekly metrics summary email to Josh.
  "0 0 * * 0": { module: "crons_actions", fn: "weeklyReport", internal: true },
};

async function runConvex(env: CloudflareEnv, fnRef: ConvexFn): Promise<unknown> {
  const url = `${env.CONVEX_URL}/api/run/${fnRef.module}/${fnRef.fn}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ args: {}, format: "json" }),
  });
  if (!resp.ok) {
    throw new Error(
      `Convex ${fnRef.module}:${fnRef.fn} failed: ${resp.status} ${await resp.text()}`,
    );
  }
  return await resp.json();
}

export default {
  fetch: handler.fetch,

  async scheduled(
    controller: ScheduledController,
    env: CloudflareEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    const target = CRON_MAP[controller.cron];
    if (!target) {
      console.warn(`No cron mapping for "${controller.cron}"`);
      return;
    }
    console.log(`Cron fired: ${controller.cron} → ${target.module}:${target.fn}`);
    // Use ctx.waitUntil so the dispatch is not cut off after the handler returns.
    ctx.waitUntil(
      runConvex(env, target).catch((err) =>
        console.error(`Cron dispatch failed for ${controller.cron}:`, err),
      ),
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;
