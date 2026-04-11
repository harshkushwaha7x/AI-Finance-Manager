import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { SiteContainer } from "@/components/shared/site-container";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Terms",
  description:
    "Read the usage terms for the AI Finance Manager portfolio MVP, including the assistive and non-advisory role of AI outputs.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Terms"
        title="Terms for the AI Finance Manager portfolio MVP"
        description="These terms clarify how the product should be used and reinforce that AI-generated finance output is assistive, not professional advice."
      />
      <section className="py-20">
        <SiteContainer className="max-w-4xl rounded-[2rem] border border-black/6 bg-surface p-8 text-base leading-8 text-muted">
          <p>
            AI Finance Manager is a portfolio project in active development. Financial insights,
            document extraction, invoice summaries, and tax-related outputs are intended to support
            user workflows and should not be treated as legal, tax, accounting, or investment
            advice. Users should validate important decisions with qualified professionals before
            acting on AI-generated recommendations.
          </p>
        </SiteContainer>
      </section>
    </>
  );
}
