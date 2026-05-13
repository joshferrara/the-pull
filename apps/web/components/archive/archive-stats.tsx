import { AsciiRule } from "@/components/terminal";

interface Props {
  editions: number;
  earliest?: string;
}

export function ArchiveStats({ editions, earliest }: Props) {
  return (
    <div className="mt-12">
      <AsciiRule label="stats" />
      <p className="mt-3 font-mono text-[var(--text-caption)] text-[color:var(--color-overlay1)]">
        total: {editions} {editions === 1 ? "edition" : "editions"}
        {earliest && <> · running since {earliest}</>}
      </p>
    </div>
  );
}
