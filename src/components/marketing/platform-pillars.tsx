import { BriefcaseBusiness, ChartSpline, Sparkles } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { SiteContainer } from "@/components/shared/site-container";
import { platformPillars } from "@/lib/constants/site";

const icons = [ChartSpline, BriefcaseBusiness, Sparkles];

export function PlatformPillars() {
  return (
    <section className="py-20">
      <SiteContainer>
        <SectionHeading
          eyebrow="Product vision"
          title="Three layers that make the platform feel like a real startup product"
          description="The MVP is intentionally broad enough to tell a serious product story, while still being structured for steady daily shipping."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {platformPillars.map((pillar, index) => {
            const Icon = icons[index];
            return (
              <article
                key={pillar.title}
                className="rounded-[1.75rem] border border-black/6 bg-surface p-7 shadow-[0_26px_80px_-55px_rgba(17,24,39,0.45)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold text-foreground">{pillar.title}</h3>
                <p className="mt-4 text-base leading-7 text-muted">{pillar.description}</p>
              </article>
            );
          })}
        </div>
      </SiteContainer>
    </section>
  );
}
