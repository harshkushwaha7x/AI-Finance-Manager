import { PageHero } from "@/components/marketing/page-hero";
import { SiteContainer } from "@/components/shared/site-container";

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Terms"
        title="Terms placeholder for the startup-style MVP"
        description="The product copy already positions AI outputs as assistive and non-advisory. This page formalizes that stance in a basic legal shell."
      />
      <section className="py-20">
        <SiteContainer className="max-w-4xl rounded-[2rem] border border-black/6 bg-surface p-8 text-base leading-8 text-muted">
          <p>
            AI Finance Manager is a portfolio project in active development. Financial insights, document
            extraction, and tax-related summaries are intended to support user workflows and should not be
            treated as legal, tax, or investment advice.
          </p>
        </SiteContainer>
      </section>
    </>
  );
}
