import { VerifyClient } from "@/components/verify-client";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; cli_callback?: string; next?: string }>;
}) {
  const { code, cli_callback, next } = await searchParams;
  return (
    <div className="max-w-md mx-auto px-6 py-24 w-full">
      <VerifyClient
        code={code}
        cliCallback={cli_callback}
        next={next ?? "/dashboard"}
      />
    </div>
  );
}
