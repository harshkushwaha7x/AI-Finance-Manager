import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-36 w-full rounded-[1.5rem] border border-border bg-background px-4 py-4 text-sm text-foreground outline-none transition placeholder:text-muted/80 focus:border-primary focus:ring-4 focus:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
