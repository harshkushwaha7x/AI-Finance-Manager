import { Cpu, FileStack, LayoutDashboard, ReceiptIndianRupee, ScrollText, UsersRound } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { SiteContainer } from "@/components/shared/site-container";
import { featureGrid } from "@/lib/constants/site";

const icons = [LayoutDashboard, FileStack, Cpu, ReceiptIndianRupee, UsersRound, ScrollText];

export function FeatureGrid() {
  return (
    <section className="py-20">
      <SiteContainer>
        <SectionHeading
          eyebrow="Feature map"
          title="A portfolio-ready product surface with real expansion room"
          description="The foundation ships with enough range to demonstrate product thinking, architecture depth, and frontend craft."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featureGrid.map((feature, index) => {
            const Icon = icons[index];
            return (
              <article
                key={feature.title}
                className="rounded-[1.6rem] border border-black/6 bg-surface-subtle p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_22px_70px_-50px_rgba(17,24,39,0.55)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-foreground">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </SiteContainer>
    </section>
  );
}
