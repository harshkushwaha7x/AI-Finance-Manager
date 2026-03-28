import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
};

export function AppLogo({ className }: AppLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-lg shadow-foreground/15">
        AF
      </div>
      <div className="space-y-0.5">
        <p className="font-display text-sm font-bold tracking-tight text-foreground">
          AI Finance Manager
        </p>
        <p className="text-xs text-muted">Finance OS + Accountant Service</p>
      </div>
    </div>
  );
}
