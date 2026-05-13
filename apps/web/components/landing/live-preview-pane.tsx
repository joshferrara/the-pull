"use client";

import type { Brief } from "@the-pull/schema";
import { TerminalPane, MetaChip } from "@/components/terminal";
import { useTypewriter } from "@/lib/use-typewriter";
import { useEffect, useState } from "react";

interface Props {
  brief: Brief | null;
}

const COMMAND = "curl -s https://thepull.dev/api/v1/today.json | jq";

export function LivePreviewPane({ brief }: Props) {
  const { visible: typed, done } = useTypewriter(COMMAND, 22, 250);
  const [revealedCount, setRevealedCount] = useState(0);
  const itemCount = brief?.items.length ?? 0;

  useEffect(() => {
    if (!done) return;
    if (!brief) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRevealedCount(itemCount);
      return;
    }
    let i = 0;
    const tick = () => {
      i += 1;
      setRevealedCount(i);
      if (i < itemCount) setTimeout(tick, 180);
    };
    const id = setTimeout(tick, 200);
    return () => clearTimeout(id);
  }, [done, brief, itemCount]);

  return (
    <TerminalPane title="bash — preview">
      <div className="p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[color:var(--color-prompt)]">$</span>
          <span className="text-[color:var(--color-text)]">{typed}</span>
          {!done && <span className="caret bg-[color:var(--color-text)]" />}
        </div>

        {done && brief && (
          <div className="mt-3 space-y-1">
            <Row revealed>
              <span className="text-[color:var(--color-overlay1)]">{`{`}</span>
            </Row>
            <Row revealed indent>
              <span className="text-[color:var(--color-blue)]">&quot;edition&quot;</span>
              <span className="text-[color:var(--color-overlay1)]">: </span>
              <span className="text-[color:var(--color-mauve)] tabular-nums">{brief.edition}</span>
              <span className="text-[color:var(--color-overlay1)]">,</span>
            </Row>
            <Row revealed indent>
              <span className="text-[color:var(--color-blue)]">&quot;date&quot;</span>
              <span className="text-[color:var(--color-overlay1)]">: </span>
              <span className="text-[color:var(--color-green)]">&quot;{brief.date}&quot;</span>
              <span className="text-[color:var(--color-overlay1)]">,</span>
            </Row>
            <Row revealed indent>
              <span className="text-[color:var(--color-blue)]">&quot;items&quot;</span>
              <span className="text-[color:var(--color-overlay1)]">: [</span>
            </Row>
            {brief.items.map((item, i) => (
              <Row key={item.id} revealed={i < revealedCount} indent>
                <span className="text-[color:var(--color-overlay1)] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[color:var(--color-overlay1)]"> · </span>
                <MetaChip label={item.category} />
                <span className="ml-1.5 text-[color:var(--color-text)] truncate">
                  {item.title}
                </span>
              </Row>
            ))}
            <Row revealed indent>
              <span className="text-[color:var(--color-overlay1)]">]</span>
            </Row>
            <Row revealed>
              <span className="text-[color:var(--color-overlay1)]">{`}`}</span>
            </Row>
          </div>
        )}

        {done && !brief && (
          <p className="mt-3 text-[color:var(--color-overlay1)]">
            no editions yet · check back monday.
          </p>
        )}

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[color:var(--color-prompt)]">$</span>
          <span className="caret bg-[color:var(--color-text)]" />
        </div>
      </div>
    </TerminalPane>
  );
}

function Row({
  revealed,
  indent,
  children,
}: {
  revealed: boolean;
  indent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "flex items-center gap-1 transition-all duration-200 ease-out " +
        (revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1") +
        " " +
        (indent ? "pl-3" : "")
      }
      aria-hidden={!revealed}
    >
      {children}
    </div>
  );
}
