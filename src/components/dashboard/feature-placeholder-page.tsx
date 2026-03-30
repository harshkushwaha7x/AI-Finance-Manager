import { ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type FeaturePlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  primaryAction: string;
  secondaryAction: string;
};

export function FeaturePlaceholderPage({
  eyebrow,
  title,
  description,
  highlights,
  primaryAction,
  secondaryAction,
}: FeaturePlaceholderPageProps) {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={eyebrow} title={title} description={description} badge="In progress" />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>What lands here next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-2xl border border-black/6 bg-surface-subtle px-4 py-4 text-sm leading-7 text-muted"
              >
                {highlight}
              </div>
            ))}
          </CardContent>
        </Card>
        <section className="rounded-[1.8rem] bg-foreground p-7 text-white panel-shadow">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/55">Daily build target</p>
          <p className="mt-4 text-base leading-8 text-white/78">
            This route is scaffolded so you can ship page structure, components, API work, and tests as
            small independent commits without redesigning navigation later.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Button className="justify-between bg-primary text-white hover:bg-primary-strong">
              {primaryAction}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              className="justify-between border-white/12 bg-white/8 text-white hover:bg-white/12"
            >
              {secondaryAction}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
