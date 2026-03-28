import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/shared/section-heading";
import { SiteContainer } from "@/components/shared/site-container";
import { aboutPrinciples } from "@/lib/constants/site";

const storyMoments = [
  "Most finance tools feel either too consumer-simple or too accounting-heavy for modern solo builders and SMB operators.",
  "This product aims to bridge that gap with a startup-grade UX, not just another CRUD dashboard.",
  "The long-term vision is a software-plus-service experience where AI handles repetitive work and accountants step in when nuance matters.",
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About the product"
        title="Built like a serious fintech startup concept, not just a demo app."
        description="AI Finance Manager is designed to look credible in a portfolio, feel realistic in a product review, and scale into a richer finance platform over time."
      />
      <section className="py-20">
        <SiteContainer className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHeading
              eyebrow="Why this exists"
              title="A modern operating system for money workflows"
              description="The product combines cash visibility, finance task management, AI assistance, and accountant service coordination into one experience."
            />
          </div>
          <div className="space-y-4">
            {storyMoments.map((item, index) => (
              <article
                key={item}
                className="rounded-[1.5rem] border border-black/6 bg-surface p-6 shadow-[0_18px_60px_-50px_rgba(17,24,39,0.45)]"
              >
                <p className="font-mono text-sm text-primary">0{index + 1}</p>
                <p className="mt-3 text-base leading-8 text-muted">{item}</p>
              </article>
            ))}
          </div>
        </SiteContainer>
      </section>
      <section className="pb-20">
        <SiteContainer className="grid gap-6 lg:grid-cols-3">
          {aboutPrinciples.map((principle) => (
            <article key={principle.title} className="rounded-[1.6rem] border border-black/6 bg-surface-subtle p-7">
              <h2 className="font-display text-2xl font-bold text-foreground">{principle.title}</h2>
              <p className="mt-4 text-sm leading-7 text-muted">{principle.description}</p>
            </article>
          ))}
        </SiteContainer>
      </section>
    </>
  );
}
