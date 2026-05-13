import { ReactNode } from "react";

interface Props {
  label?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "warn";
}

export function BoxFrame({ label, children, className, tone = "default" }: Props) {
  const border =
    tone === "accent"
      ? "border-[color:var(--color-mauve)]"
      : tone === "warn"
        ? "border-[color:var(--color-peach)]"
        : "border-[color:var(--color-rule)]";
  const labelColor =
    tone === "accent"
      ? "text-[color:var(--color-mauve)]"
      : tone === "warn"
        ? "text-[color:var(--color-peach)]"
        : "text-[color:var(--color-overlay1)]";
  return (
    <div
      className={
        "relative rounded-md border " +
        border +
        " bg-[color:color-mix(in_oklab,var(--color-mantle)_70%,transparent)] " +
        (className ?? "")
      }
    >
      {label && (
        <div
          className={
            "absolute -top-2.5 left-3 px-1.5 font-mono text-[var(--text-micro)] uppercase tracking-wider bg-[color:var(--color-base)] " +
            labelColor
          }
        >
          {label}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
