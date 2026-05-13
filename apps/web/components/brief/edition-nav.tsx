import Link from "next/link";
import { AsciiRule, PromptLine } from "@/components/terminal";

interface Props {
  date: string;
}

export function EditionNav({ date }: Props) {
  return (
    <div className="mt-16">
      <AsciiRule label="eof" />
      <div className="mt-4">
        <PromptLine path={`~/ed-${date}`}>exit</PromptLine>
      </div>
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <Link
          href="/archive"
          className="rounded-lg border border-[color:var(--color-rule)] p-4 no-underline hover:bg-[color:var(--color-mantle)] transition-colors"
        >
          <div className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay1)]">
            ← archive
          </div>
          <div className="mt-1 text-[color:var(--color-text)]">all editions</div>
        </Link>
        <Link
          href="/brief/latest"
          className="rounded-lg border border-[color:var(--color-rule)] p-4 no-underline hover:bg-[color:var(--color-mantle)] transition-colors"
        >
          <div className="font-mono text-[var(--text-micro)] uppercase tracking-wider text-[color:var(--color-overlay1)]">
            latest →
          </div>
          <div className="mt-1 text-[color:var(--color-text)]">today&apos;s brief</div>
        </Link>
      </div>
    </div>
  );
}
