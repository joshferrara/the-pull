interface Props { remaining: number }

export function PreviewGate({ remaining }: Props) {
  return <div className="mt-12 text-[color:var(--color-overlay1)] font-mono text-[var(--text-caption)]">[preview gate placeholder · {remaining} items locked]</div>;
}
