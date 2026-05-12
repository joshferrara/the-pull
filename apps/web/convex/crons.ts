import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 9 PM Central = 02:00 UTC. Mon-Fri (cron handles next-day calc separately).
crons.cron(
  "Nightly bookmark sync + agent draft",
  "0 2 * * 1-5",
  internal.crons_actions.nightlyPipeline,
);

// 6 AM ET = 11:00 UTC (winter ET = 11, summer = 10; Convex cron runs daily —
// the publish action itself targets today-in-ET, so an extra run is a no-op).
crons.cron(
  "Publish scheduled brief",
  "0 11 * * 1-5",
  internal.publish.publishScheduledBrief,
);

// 7 AM ET — rollup yesterday's stats
crons.cron(
  "Daily stats rollup",
  "0 12 * * 1-5",
  internal.crons_actions.dailyRollup,
);

// Daily auth code cleanup
crons.daily(
  "Cleanup expired auth codes",
  { hourUTC: 0, minuteUTC: 0 },
  internal.auth.cleanupExpiredCodes,
);

export default crons;
