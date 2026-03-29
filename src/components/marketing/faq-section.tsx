"use client";

import { ChevronDown } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { SiteContainer } from "@/components/shared/site-container";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: FaqItem[];
};

export function FaqSection({
  eyebrow,
  title,
  description,
  items,
}: FaqSectionProps) {
  return (
    <section className="py-20">
      <SiteContainer>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        <div className="mt-12 space-y-4">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-[1.5rem] border border-black/6 bg-surface p-6 shadow-[0_18px_60px_-54px_rgba(17,24,39,0.45)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                <span className="font-display text-xl font-bold text-foreground">
                  {item.question}
                </span>
                <ChevronDown className="h-5 w-5 shrink-0 text-muted transition group-open:rotate-180" />
              </summary>
              <p className="mt-4 max-w-4xl text-sm leading-8 text-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </SiteContainer>
    </section>
  );
}
