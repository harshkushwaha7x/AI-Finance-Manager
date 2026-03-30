import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionToolbarProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function SectionToolbar({
  title,
  description,
  actions,
  className,
}: SectionToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-7 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
