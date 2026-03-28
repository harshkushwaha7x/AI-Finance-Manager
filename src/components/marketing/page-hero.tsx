import { Badge } from "@/components/ui/badge";
import { SiteContainer } from "@/components/shared/site-container";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="border-b border-black/5 bg-white/60">
      <SiteContainer className="py-16 sm:py-20">
        <Badge>{eyebrow}</Badge>
        <h1 className="mt-6 max-w-4xl text-balance font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">{description}</p>
      </SiteContainer>
    </section>
  );
}
