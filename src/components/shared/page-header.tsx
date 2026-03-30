import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  badge?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-4xl font-bold tracking-tight text-foreground">{title}</h2>
          {badge ? <Badge variant="secondary">{badge}</Badge> : null}
        </div>
        <p className="mt-4 text-base leading-8 text-muted">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
