import type { Brief } from "@the-pull/schema";

interface Props { brief: Brief | null }

export function Hero({ brief }: Props) {
  return <section className="px-6 py-12 text-[color:var(--color-overlay1)]">[hero placeholder · brief edition #{brief?.edition ?? "—"}]</section>;
}
