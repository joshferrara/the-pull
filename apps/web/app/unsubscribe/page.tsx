import { redirect } from "next/navigation";
import { verifyWebToken } from "@/lib/auth";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/");
  const verified = await verifyWebToken(token);
  if (!verified) redirect("/");
  await convexClient().mutation(api.users.setEmailEnabled, {
    userId: verified.userId,
    enabled: false,
  });
  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-3">Unsubscribed</h1>
      <p className="text-[color:var(--color-subtext1)]">
        You won&apos;t receive any more emails. Visit{" "}
        <a href="/dashboard" className="text-[color:var(--color-mauve)]">
          /dashboard
        </a>{" "}
        to re-enable later or revoke tokens.
      </p>
    </main>
  );
}
