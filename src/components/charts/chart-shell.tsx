import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChartShellProps = {
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
  className?: string;
};

export function ChartShell({
  title,
  description,
  badge,
  children,
  className,
}: ChartShellProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
          </div>
          {badge ? <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted">{badge}</p> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
