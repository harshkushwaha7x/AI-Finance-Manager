import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateCardProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyStateCard({
  title,
  description,
  action,
  className,
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center",
        className,
      )}
    >
      <p className="font-display text-2xl font-bold text-foreground">{title}</p>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
