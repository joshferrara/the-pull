import { ReactNode } from "react";

interface Props {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function TerminalPane({ title = "bash — the-pull", children, className }: Props) {
  return (
    <div
      className={
        "rounded-lg border border-[color:var(--color-surface1)] bg-[color:var(--color-mantle)] overflow-hidden shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)] " +
        (className ?? "")
      }
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[color:var(--color-surface1)] bg-[color:var(--color-crust)]">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[color:var(--color-red)] opacity-70" />
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[color:var(--color-yellow)] opacity-70" />
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[color:var(--color-green)] opacity-70" />
        <span className="ml-3 font-mono text-[var(--text-micro)] text-[color:var(--color-overlay1)]">
          {title}
        </span>
      </div>
      <div className="font-mono text-[var(--text-caption)] text-[color:var(--color-text)]">
        {children}
      </div>
    </div>
  );
}
