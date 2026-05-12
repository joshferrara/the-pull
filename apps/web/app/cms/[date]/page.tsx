import { redirect } from "next/navigation";


export default async function CmsByDateRedirect({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  redirect(`/cms?date=${encodeURIComponent(date)}`);
}
