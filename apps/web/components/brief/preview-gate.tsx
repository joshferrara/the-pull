import { BoxFrame } from "@/components/terminal";
import { EmailSignup } from "@/components/email-signup";

interface Props {
  remaining: number;
}

export function PreviewGate({ remaining }: Props) {
  if (remaining <= 0) {
    return (
      <div className="mt-16 max-w-[var(--w-prose)]">
        <BoxFrame label="locked" tone="accent">
          <p className="text-[color:var(--color-subtext1)] mb-4">
            Subscribe to read full summaries, commentary, and source links for every edition.
          </p>
          <EmailSignup id="brief-email" />
        </BoxFrame>
      </div>
    );
  }
  return (
    <div className="mt-16 max-w-[var(--w-prose)]">
      <BoxFrame label="access required" tone="accent">
        <p className="text-[color:var(--color-subtext1)] mb-4">
          The remaining <span className="text-[color:var(--color-text)]">{remaining}</span> items are
          unlocked for subscribers.
        </p>
        <EmailSignup id="brief-email" />
      </BoxFrame>
    </div>
  );
}
