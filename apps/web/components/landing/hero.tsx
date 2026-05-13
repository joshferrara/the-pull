"use client";

import { useState } from "react";
import type { Brief } from "@the-pull/schema";
import { PromptLine } from "@/components/terminal";
import { InstallTabs } from "./install-tabs";
import { EmailSignup } from "@/components/email-signup";
import { LivePreviewPane } from "./live-preview-pane";

interface Props {
  brief: Brief | null;
}

export function Hero({ brief }: Props) {
  const [emailOpen, setEmailOpen] = useState(false);

  return (
    <section className="max-w-[var(--w-grid)] mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-start">
      <div>
        <PromptLine path="~/the-pull">today --preview</PromptLine>
        <h1 className="mt-5 text-[var(--text-h1)] md:text-[var(--text-display)] leading-[1.05] font-semibold tracking-tight text-[color:var(--color-text)]">
          The daily AI brief,
          <br />
          <span className="text-[color:var(--color-mauve)]">delivered where you build.</span>
        </h1>
        <p className="mt-6 text-[var(--text-body)] text-[color:var(--color-subtext1)] max-w-md">
          For developers who can&apos;t keep up with AI but need to. 7ish items,
          weekday mornings, in your terminal, agent, inbox, or feed reader.
        </p>

        <div className="mt-10">
          <InstallTabs onChooseEmail={() => setEmailOpen(true)} />
        </div>

        <div className={"mt-6 max-w-md " + (emailOpen ? "block" : "hidden")}>
          <EmailSignup id="hero-email" />
        </div>

        <div className="mt-6 text-[var(--text-caption)] text-[color:var(--color-overlay1)] font-mono">
          {!emailOpen && (
            <>
              or get it{" "}
              <button
                type="button"
                onClick={() => setEmailOpen(true)}
                className="underline underline-offset-2 text-[color:var(--color-mauve)]"
              >
                in your inbox
              </button>
              .
            </>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-20">
        <LivePreviewPane brief={brief} />
      </div>
    </section>
  );
}
