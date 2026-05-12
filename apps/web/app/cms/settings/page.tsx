import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CmsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ twitter?: string }>;
}) {
  const { twitter } = await searchParams;
  const session = await readSession();
  const tw = session
    ? await convexClient().query(api.twitter_auth.get, {
        curatorEmail: session.email,
      })
    : null;

  return (
    <main className="py-6 space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)] mb-2">
          X (Twitter) bookmarks
        </h2>
        {tw && tw.expiresAt > Date.now() ? (
          <div className="text-sm text-[color:var(--color-subtext1)]">
            <p>
              Connected as user id <code>{tw.userId}</code>. Token expires{" "}
              <code>{new Date(tw.expiresAt).toLocaleString()}</code>.
            </p>
            <p className="mt-2 flex gap-2">
              <a
                href="/api/cms/twitter/start"
                className="text-xs px-2 py-1 rounded bg-[color:var(--color-surface0)]"
              >
                Reauthorize
              </a>
              <a
                href="/api/cms/twitter/disconnect"
                className="text-xs px-2 py-1 rounded bg-[color:var(--color-surface0)] text-[color:var(--color-red)]"
              >
                Disconnect
              </a>
            </p>
          </div>
        ) : (
          <div className="text-sm text-[color:var(--color-subtext1)]">
            <p>
              The X bookmarks endpoint requires OAuth 2.0 user-context auth.
              Connect once and the nightly sync runs against your bookmarks.
            </p>
            <p className="mt-2">
              <a
                href="/api/cms/twitter/start"
                className="inline-block px-3 py-1.5 rounded bg-[color:var(--color-blue)] text-[color:var(--color-crust)] text-sm font-medium"
              >
                Connect X
              </a>
            </p>
            {twitter === "connected" && (
              <p className="mt-2 text-[color:var(--color-green)] text-xs">
                Connected. Run a manual sync from /cms/bookmarks to confirm.
              </p>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)] mb-2">
          iOS Share Sheet
        </h2>
        <p className="text-sm text-[color:var(--color-subtext1)]">
          Create an iOS Shortcut named &ldquo;Add to The Pull&rdquo;. Configure
          a single &ldquo;Get contents of URL&rdquo; action with:
        </p>
        <ul className="text-sm text-[color:var(--color-subtext0)] list-disc ml-5 mt-2 space-y-1">
          <li>
            <strong>URL:</strong>{" "}
            <code>https://thepull.dev/api/v1/bookmarks</code>
          </li>
          <li>
            <strong>Method:</strong> POST
          </li>
          <li>
            <strong>Headers:</strong>{" "}
            <code>Authorization: Bearer &lt;your admin token&gt;</code>,{" "}
            <code>Content-Type: application/json</code>
          </li>
          <li>
            <strong>Request body:</strong>{" "}
            <code>{`{ "url": "<ShortcutInputURL>" }`}</code>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-[color:var(--color-overlay1)] mb-2">
          Cron triggers
        </h2>
        <ul className="text-sm text-[color:var(--color-subtext0)] list-disc ml-5 space-y-1">
          <li>9 PM Central — bookmark sync + agent draft</li>
          <li>6 AM ET — publish scheduled brief, send emails</li>
          <li>7 AM ET — yesterday&apos;s analytics rollup</li>
          <li>Daily — expired auth code cleanup</li>
        </ul>
      </section>
    </main>
  );
}
