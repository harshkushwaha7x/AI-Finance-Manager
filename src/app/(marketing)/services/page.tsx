import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { SiteContainer } from "@/components/shared/site-container";
import { Button } from "@/components/ui/button";
import { servicePackages } from "@/lib/constants/site";
import { buildMetadata } from "@/lib/metadata";

const serviceSteps = [
  "Choose a package or submit a custom request.",
  "Share your current finance pain points and documents.",
  "Get routed into a managed admin workflow for qualification and scheduling.",
];

export const metadata: Metadata = buildMetadata({
  title: "Services",
  description:
    "Explore accountant service packages, finance support flows, and operational design inside AI Finance Manager.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Accountant service module"
        title="Turn the product into a service-enabled platform with real operational credibility."
        description="The accountant service lane is what makes this concept more than a dashboard. It introduces monetization, workflow coordination, and operational design."
      />
      <section className="py-20">
        <SiteContainer className="grid gap-6 lg:grid-cols-2">
          {servicePackages.map((pkg) => (
            <article
              key={pkg.name}
              className="rounded-[1.8rem] border border-black/6 bg-surface p-7 shadow-[0_20px_80px_-60px_rgba(17,24,39,0.48)]"
            >
              <p className="font-display text-2xl font-bold text-foreground">{pkg.name}</p>
              <p className="mt-4 text-base leading-8 text-muted">{pkg.description}</p>
              <Button className="mt-8">Request this package</Button>
            </article>
          ))}
        </SiteContainer>
      </section>
      <section className="pb-20">
        <SiteContainer className="rounded-[2rem] border border-black/6 bg-foreground p-8 text-white sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">Workflow</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {serviceSteps.map((step, index) => (
              <article key={step} className="rounded-[1.5rem] border border-white/10 bg-white/6 p-6">
                <p className="font-mono text-sm text-primary">0{index + 1}</p>
                <p className="mt-3 text-base leading-8 text-white/82">{step}</p>
              </article>
            ))}
          </div>
        </SiteContainer>
      </section>
    </>
  );
}
