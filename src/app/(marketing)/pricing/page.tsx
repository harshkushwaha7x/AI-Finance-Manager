import type { Metadata } from "next";
import { Check } from "lucide-react";

import { FaqSection } from "@/components/marketing/faq-section";
import { PageHero } from "@/components/marketing/page-hero";
import { PricingComparison } from "@/components/marketing/pricing-comparison";
import { SiteContainer } from "@/components/shared/site-container";
import { marketingFaqs, pricingTiers } from "@/lib/constants/site";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Pricing",
  description:
    "See the Starter, Pro, and Business positioning for AI Finance Manager and how the service layer supports monetization.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing strategy"
        title="Frame the business model like a serious SaaS from day one."
        description="The pricing surface communicates who the product serves, where the AI value sits, and how the accountant service module becomes part of the monetization story."
      />
      <section className="py-20">
        <SiteContainer className="grid gap-6 xl:grid-cols-3">
          {pricingTiers.map((tier, index) => (
            <article
              key={tier.name}
              className={`rounded-[1.8rem] border p-7 ${index === 1 ? "border-primary bg-foreground text-white" : "border-black/6 bg-surface"}`}
            >
              <p className={`text-sm font-semibold ${index === 1 ? "text-white/65" : "text-muted"}`}>{tier.name}</p>
              <p className="mt-4 font-display text-4xl font-bold">{tier.price}</p>
              <p className={`mt-3 text-sm leading-7 ${index === 1 ? "text-white/72" : "text-muted"}`}>{tier.audience}</p>
              <div className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex gap-3 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 ${index === 1 ? "text-primary" : "text-success"}`} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </SiteContainer>
      </section>
      <PricingComparison />
      <FaqSection
        eyebrow="Pricing FAQ"
        title="Clarify how the plans are meant to evolve"
        description="The MVP uses pricing to communicate product strategy clearly, even before live billing is introduced."
        items={marketingFaqs}
      />
    </>
  );
}
