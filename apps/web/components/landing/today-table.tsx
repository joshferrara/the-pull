import type { Brief } from "@the-pull/schema";

interface Props { brief: Brief | null }

export function TodayTable({ brief }: Props) {
  return <section className="px-6 py-12 text-[color:var(--color-overlay1)]">[today table placeholder · {brief?.items.length ?? 0} items]</section>;
}
