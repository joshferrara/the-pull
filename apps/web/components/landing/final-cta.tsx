import { AsciiRule, TerminalPane } from "@/components/terminal";
import { EmailSignup } from "@/components/email-signup";

export function FinalCta() {
  return (
    <section className="max-w-[var(--w-grid)] mx-auto px-6 pb-32">
      <AsciiRule label="join" number="04" />
      <div className="mt-8 max-w-[var(--w-wide)]">
        <TerminalPane title="bash — subscribe">
          <div className="p-5">
            <p className="text-[color:var(--color-overlay1)] mb-1">
              <span className="text-[color:var(--color-prompt)]">$</span>{" "}
              <span className="text-[color:var(--color-text)]">subscribe</span>
            </p>
            <div className="mt-3">
              <EmailSignup />
            </div>
          </div>
        </TerminalPane>
      </div>
    </section>
  );
}
