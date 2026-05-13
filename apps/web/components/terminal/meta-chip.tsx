interface Props {
  label: string;
  /** Optional 0-1 importance (renders a ▓▓▓░░ bar). */
  bar?: number;
  variant?: "default" | "mauve" | "muted";
  className?: string;
}

const BAR_CELLS = 5;

function bar(value: number) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * BAR_CELLS);
  return "▓".repeat(filled) + "░".repeat(BAR_CELLS - filled);
}

export function MetaChip({ label, bar: b, variant = "default", className }: Props) {
  const palette =
    variant === "mauve"
      ? "bg-[color:color-mix(in_oklab,var(--color-mauve)_18%,transparent)] text-[color:var(--color-mauve)]"
      : variant === "muted"
        ? "bg-[color:var(--color-mantle)] text-[color:var(--color-overlay1)]"
        : "bg-[color:var(--color-surface0)] text-[color:var(--color-subtext0)]";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded font-mono text-[var(--text-micro)] uppercase tracking-wider tabular-nums " +
        palette +
        " " +
        (className ?? "")
      }
    >
      <span>{label}</span>
      {typeof b === "number" && (
        <span className="text-[color:var(--color-mauve)] tracking-tight">
          {bar(b)}
        </span>
      )}
    </span>
  );
}
