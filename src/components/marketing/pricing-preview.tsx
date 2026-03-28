import Link from "next/link";
import { Check } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { SiteContainer } from "@/components/shared/site-container";
import { Button } from "@/components/ui/button";
import { pricingTiers } from "@/lib/constants/site";

export function PricingPreview() {
  return (
    <section className="py-20">
      <SiteContainer>
        <SectionHeading
          eyebrow="Monetization"
          title="Price it like a modern SaaS, sell it like a service-enabled platform"
          description="Even before real billing lands, the pricing surface tells a credible product strategy story to recruiters and future clients."
          align="center"
        />
        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {pricingTiers.map((tier, index) => (
            <article
              key={tier.name}
              className={`rounded-[1.8rem] border p-7 shadow-[0_24px_80px_-58px_rgba(17,24,39,0.5)] ${
                index === 1 ? "border-primary bg-foreground text-white" : "border-black/6 bg-surface"
              }`}
            >
              <p className={`text-sm font-semibold ${index === 1 ? "text-white/70" : "text-muted"}`}>{tier.name}</p>
              <p className="mt-4 font-display text-4xl font-bold">{tier.price}</p>
              <p className={`mt-3 text-sm leading-7 ${index === 1 ? "text-white/74" : "text-muted"}`}>
                {tier.audience}
              </p>
              <div className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 ${index === 1 ? "text-primary" : "text-success"}`} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button
                asChild
                size="lg"
                variant={index === 1 ? "primary" : "secondary"}
                className="mt-8 w-full"
              >
                <Link href="/pricing">{index === 1 ? "See full pricing" : "View plan details"}</Link>
              </Button>
            </article>
          ))}
        </div>
      </SiteContainer>
    </section>
  );
}
