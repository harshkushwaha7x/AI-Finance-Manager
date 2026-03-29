import type { Metadata } from "next";

import { CtaBanner } from "@/components/marketing/cta-banner";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { FaqSection } from "@/components/marketing/faq-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { PlatformPillars } from "@/components/marketing/platform-pillars";
import { PricingPreview } from "@/components/marketing/pricing-preview";
import { ProductPreview } from "@/components/marketing/product-preview";
import { TrustBar } from "@/components/marketing/trust-bar";
import { SectionHeading } from "@/components/shared/section-heading";
import { SiteContainer } from "@/components/shared/site-container";
import { marketingFaqs } from "@/lib/constants/site";
import { buildMetadata } from "@/lib/metadata";

const launchPhases = [
  "Premium marketing and dashboard shell",
  "Finance engine for transactions, budgets, and goals",
  "Document intelligence and AI workflows",
  "Accountant service intake, admin ops, and deployment polish",
];

export const metadata: Metadata = buildMetadata({
  title: "AI Finance Manager",
  description:
    "Explore an India-first AI finance platform with premium SaaS UX, accountant service operations, and a modern product narrative.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <PlatformPillars />
      <ProductPreview />
      <section className="py-20">
        <SiteContainer>
          <SectionHeading
            eyebrow="30-day build strategy"
            title="A roadmap that favors visible progress, clean commit slices, and recruiter-friendly momentum"
            description="The product is intentionally structured so each day can produce multiple real commits without resorting to fake activity."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {launchPhases.map((phase, index) => (
              <article
                key={phase}
                className="rounded-[1.6rem] border border-black/6 bg-surface p-6 shadow-[0_20px_70px_-55px_rgba(17,24,39,0.55)]"
              >
                <p className="font-mono text-sm text-primary">0{index + 1}</p>
                <h3 className="mt-4 font-display text-2xl font-bold text-foreground">{phase}</h3>
              </article>
            ))}
          </div>
        </SiteContainer>
      </section>
      <FeatureGrid />
      <PricingPreview />
      <FaqSection
        eyebrow="FAQ"
        title="Answer the questions recruiters, users, and future clients will ask first"
        description="A stronger FAQ section helps the product feel more decision-ready and communicates the reasoning behind the combined software-and-service model."
        items={marketingFaqs}
      />
      <CtaBanner />
    </>
  );
}
