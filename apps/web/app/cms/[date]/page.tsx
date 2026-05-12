import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";


export default async function CmsByDateRedirect({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  redirect(`/cms?date=${encodeURIComponent(date)}`);
}
