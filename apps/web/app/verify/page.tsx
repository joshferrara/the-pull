import { VerifyClient } from "@/components/verify-client";


export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; cli_callback?: string; next?: string }>;
}) {
  const { code, cli_callback, next } = await searchParams;
  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-3">Verifying…</h1>
      <VerifyClient
        code={code}
        cliCallback={cli_callback}
        next={next ?? "/dashboard"}
      />
    </main>
  );
}
