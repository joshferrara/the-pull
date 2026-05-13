import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { DashboardClient } from "@/components/dashboard-client";
import { PromptLine } from "@/components/terminal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await readSession();
  if (!session) redirect("/?reauth=1");
  const user = await convexClient().query(api.users.getById, { userId: session.userId });
  if (!user) redirect("/");
  const tokens = await convexClient().query(api.tokens.listForUser, { userId: session.userId });
  const signupDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <article className="max-w-[var(--w-wide)] mx-auto px-6 py-12">
      <header className="mb-12">
        <PromptLine path="~/account">whoami</PromptLine>
        <h1 className="mt-4 font-mono text-[var(--text-h2)] text-[color:var(--color-text)] break-all">
          {user.email}
        </h1>
        <p className="mt-1 font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
          member since {signupDate} · tier: free
        </p>
      </header>
      <DashboardClient
        userId={session.userId}
        initialPreferences={user.preferences}
        initialTimezone={user.timezone ?? ""}
        initialTokens={tokens.map((t) => ({
          id: t._id,
          token: t.token,
          scope: t.scope,
          label: t.label,
          created_at: new Date(t.createdAt).toISOString(),
          last_used_at: t.lastUsedAt ? new Date(t.lastUsedAt).toISOString() : null,
          revoked: !!t.revokedAt,
        }))}
      />
    </article>
  );
}
