import { redirect } from "next/navigation";
import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";


export default async function LatestBriefRedirect() {
  const latest = await convexClient().query(api.briefs.getLatestPublished);
  if (!latest) redirect("/archive");
  redirect(`/brief/${latest.date}`);
}
