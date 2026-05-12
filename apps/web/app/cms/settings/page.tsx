
export default function CmsSettingsPage() {
  return (
    <main className="py-6 space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>
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
            <code>
              {`{ "url": "<ShortcutInputURL>" }`}
            </code>
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

export const dynamic = "force-dynamic";
