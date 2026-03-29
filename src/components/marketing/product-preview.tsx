import { ArrowUpRight } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { SiteContainer } from "@/components/shared/site-container";
import { productPreviewCards } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

const accentStyles: Record<string, string> = {
  primary: "bg-primary/8 text-primary border-primary/15",
  secondary: "bg-secondary/8 text-secondary border-secondary/15",
  foreground: "bg-foreground text-white border-black/0",
};

export function ProductPreview() {
  return (
    <section className="py-20">
      <SiteContainer>
        <SectionHeading
          eyebrow="Product preview"
          title="Show the shape of the platform before every data workflow is live"
          description="This section helps recruiters and collaborators understand how the product expands from marketing into a full finance operating system."
        />
        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {productPreviewCards.map((card) => (
            <article
              key={card.title}
              className={cn(
                "rounded-[1.8rem] border p-7 shadow-[0_24px_80px_-60px_rgba(17,24,39,0.55)]",
                accentStyles[card.accent],
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-2xl font-bold">{card.title}</h3>
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <p className={cn("mt-4 text-sm leading-7", card.accent === "foreground" ? "text-white/76" : "text-muted")}>
                {card.description}
              </p>
              <div className="mt-8 space-y-3">
                {card.bullets.map((item) => (
                  <div
                    key={item}
                    className={cn(
                      "rounded-2xl border px-4 py-4 text-sm",
                      card.accent === "foreground"
                        ? "border-white/12 bg-white/8 text-white/78"
                        : "border-black/6 bg-white/70 text-muted",
                    )}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SiteContainer>
    </section>
  );
}
