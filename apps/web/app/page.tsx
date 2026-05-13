import { convexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { getBriefJson } from "@/lib/r2";
import { StatusBar } from "@/components/terminal";
import { Hero } from "@/components/landing/hero";
import { TodayTable } from "@/components/landing/today-table";
import { TheDeal } from "@/components/landing/the-deal";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";

export const dynamic = "force-dynamic";

async function getLatestPreview() {
  const latest = await convexClient().query(api.briefs.getLatestPublished);
  if (!latest) return null;
  const brief = await getBriefJson(latest.date);
  if (!brief) return null;
  return brief;
}

export default async function LandingPage() {
  const brief = await getLatestPreview();

  return (
    <>
      <Hero brief={brief} />
      <TodayTable brief={brief} />
      <TheDeal />
      <Faq />
      <FinalCta />
      <StatusBar edition={brief?.edition} date={brief?.date} path="~/the-pull" />
    </>
  );
}
