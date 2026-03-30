import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
  {
    variants: {
      variant: {
        primary: "border border-primary/15 bg-primary/8 text-primary",
        secondary: "border border-secondary/15 bg-secondary/8 text-secondary",
        success: "border border-success/15 bg-success/8 text-success",
        warning: "border border-warning/20 bg-warning/10 text-warning",
        danger: "border border-danger/15 bg-danger/8 text-danger",
        neutral: "border border-black/8 bg-foreground/5 text-muted",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type BadgeProps = {
  children: ReactNode;
  className?: string;
} & VariantProps<typeof badgeVariants>;

export function Badge({ children, className, variant }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>{children}</span>
  );
}
