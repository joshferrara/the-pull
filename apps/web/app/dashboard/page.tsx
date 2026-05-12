import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";


export default async function DashboardPage() {
  const session = await readSession();
  if (!session) redirect("/?reauth=1");
  const user = await convexClient().query(api.users.getById, {
    userId: session.userId,
  });
  if (!user) redirect("/");
  const tokens = await convexClient().query(api.tokens.listForUser, {
    userId: session.userId,
  });
  const signupDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-[color:var(--color-subtext0)] mb-1">
        Signed in as <code>{user.email}</code>
      </p>
      <p className="text-xs text-[color:var(--color-overlay1)] mb-8">
        Member since {signupDate}
      </p>
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
    </main>
  );
}
