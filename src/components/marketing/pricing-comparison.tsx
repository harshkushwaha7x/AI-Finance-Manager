import { SectionHeading } from "@/components/shared/section-heading";
import { SiteContainer } from "@/components/shared/site-container";
import { pricingComparisonRows } from "@/lib/constants/site";

export function PricingComparison() {
  return (
    <section className="py-20">
      <SiteContainer>
        <SectionHeading
          eyebrow="Comparison"
          title="Show plan positioning with startup-level clarity"
          description="This comparison grid makes the pricing page feel more complete and gives the product a stronger SaaS framing."
        />
        <div className="mt-12 overflow-hidden rounded-[1.8rem] border border-black/6 bg-surface shadow-[0_20px_70px_-56px_rgba(17,24,39,0.45)]">
          <div className="grid grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr] border-b border-black/6 bg-surface-subtle px-6 py-5 text-sm font-semibold text-foreground">
            <div>Capability</div>
            <div>Starter</div>
            <div>Pro</div>
            <div>Business</div>
          </div>
          {pricingComparisonRows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr] gap-4 border-t border-black/6 px-6 py-5 text-sm leading-7 text-muted first:border-t-0"
            >
              <div className="font-semibold text-foreground">{row.label}</div>
              <div>{row.starter}</div>
              <div>{row.pro}</div>
              <div>{row.business}</div>
            </div>
          ))}
        </div>
      </SiteContainer>
    </section>
  );
}
