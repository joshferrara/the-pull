interface Props {
  label?: string;
  number?: string;
  className?: string;
}

export function AsciiRule({ label, number, className }: Props) {
  const text = label
    ? number
      ? `── ${number} · ${label} `
      : `── ${label} `
    : number
      ? `── ${number} `
      : "── ";
  return (
    <div
      className={
        "font-mono text-[color:var(--color-overlay1)] text-[var(--text-caption)] tracking-tight flex items-center gap-0 select-none " +
        (className ?? "")
      }
      aria-hidden
    >
      <span className="whitespace-pre">{text}</span>
      <span
        aria-hidden
        className="flex-1 h-px"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, var(--color-rule) 0 6px, transparent 6px 8px)",
          backgroundPosition: "left center",
          backgroundRepeat: "repeat-x",
        }}
      />
    </div>
  );
}
