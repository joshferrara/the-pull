interface Props {
  edition: number;
  size?: "display" | "h1" | "inline";
  className?: string;
}

export function EditionNumber({ edition, size = "h1", className }: Props) {
  const sizeClass =
    size === "display"
      ? "text-[var(--text-display)] leading-none"
      : size === "h1"
        ? "text-[var(--text-h1)] leading-none"
        : "text-[var(--text-body)]";
  return (
    <span
      className={
        "font-mono font-semibold tabular-nums tracking-tight text-[color:var(--color-mauve)] " +
        sizeClass +
        " " +
        (className ?? "")
      }
    >
      #{String(edition).padStart(3, "0")}
    </span>
  );
}
