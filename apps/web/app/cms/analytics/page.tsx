import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";


function yesterdayET(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export default async function CmsAnalyticsPage() {
  const briefDate = yesterdayET();
  const [briefStats, itemStats] = await Promise.all([
    convexClient().query(api.stats.getBriefStats, { briefDate }),
    convexClient().query(api.stats.getItemStats, { briefDate }),
  ]);
  return (
    <main className="py-6">
      <h1 className="text-xl font-bold mb-1">Analytics</h1>
      <p className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)] mb-6">
        {briefDate}
      </p>
      {briefStats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-6">
          <Stat label="Total views" value={briefStats.totalViews} />
          <Stat label="Unique sessions" value={briefStats.uniqueSessions} />
          <Stat label="API fetches" value={briefStats.apiFetches} />
          <Stat label="RSS fetches" value={briefStats.rssFetches} />
          <Stat label="Email opens" value={briefStats.emailOpens} />
          <Stat label="TUI launches" value={briefStats.tuiLaunches} />
        </div>
      ) : (
        <p className="text-[color:var(--color-overlay1)] text-sm">
          No data yet for {briefDate}. Rollup runs at 7 AM ET.
        </p>
      )}
      <h2 className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)] mb-2">
        Items
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[color:var(--color-overlay1)] text-xs uppercase">
            <th className="py-1">Item</th>
            <th className="py-1">Views</th>
            <th className="py-1">Saves</th>
            <th className="py-1">Clicks</th>
          </tr>
        </thead>
        <tbody>
          {itemStats.map((s) => (
            <tr key={s._id} className="border-t border-[color:var(--color-surface1)]">
              <td className="py-1 font-mono text-xs">{s.itemId}</td>
              <td>{s.views}</td>
              <td>{s.saves}</td>
              <td>{s.linkClicks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[color:var(--color-surface1)] p-3">
      <p className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)]">
        {label}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
