import { CtaBanner } from "@/components/marketing/cta-banner";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HeroSection } from "@/components/marketing/hero-section";
import { PlatformPillars } from "@/components/marketing/platform-pillars";
import { PricingPreview } from "@/components/marketing/pricing-preview";
import { TrustBar } from "@/components/marketing/trust-bar";
import { SectionHeading } from "@/components/shared/section-heading";
import { SiteContainer } from "@/components/shared/site-container";

const launchPhases = [
  "Premium marketing and dashboard shell",
  "Finance engine for transactions, budgets, and goals",
  "Document intelligence and AI workflows",
  "Accountant service intake, admin ops, and deployment polish",
];

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <PlatformPillars />
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
      <CtaBanner />
    </>
  );
}
