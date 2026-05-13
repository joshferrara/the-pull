import { ReactNode } from "react";

interface Props {
  path?: string;
  caret?: boolean;
  className?: string;
  children?: ReactNode;
}

export function PromptLine({
  path = "~/the-pull",
  caret = false,
  className,
  children,
}: Props) {
  return (
    <span
      className={
        "inline-flex items-baseline gap-2 font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)] " +
        (className ?? "")
      }
    >
      <span className="text-[color:var(--color-mauve)]">{path}</span>
      <span className="text-[color:var(--color-prompt)]">$</span>
      {children && <span className="text-[color:var(--color-text)]">{children}</span>}
      {caret && <span className="caret bg-[color:var(--color-text)]" />}
    </span>
  );
}
