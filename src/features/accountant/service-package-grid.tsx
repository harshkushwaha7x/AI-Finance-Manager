import { ArrowRight, BadgeIndianRupee, Briefcase, Clock3, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPackageHighlights } from "@/features/accountant/accountant-utils";
import type { AccountantPackageRecord } from "@/types/finance";

type ServicePackageGridProps = {
  packages: AccountantPackageRecord[];
  activePackageId?: string;
  onSelect: (packageId: string) => void;
};

export function ServicePackageGrid({
  packages,
  activePackageId,
  onSelect,
}: ServicePackageGridProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {packages.map((packageRecord) => (
        <Card
          key={packageRecord.id}
          className={
            packageRecord.id === activePackageId
              ? "rounded-[1.7rem] border-primary/30 shadow-lg shadow-primary/10"
              : "rounded-[1.7rem]"
          }
        >
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="rounded-2xl bg-primary/8 p-3 text-primary">
                <Briefcase className="h-5 w-5" />
              </div>
              <Badge variant={packageRecord.isActive ? "success" : "neutral"}>
                {packageRecord.isActive ? "Active" : "Paused"}
              </Badge>
            </div>
            <CardTitle className="mt-4">{packageRecord.name}</CardTitle>
            <CardDescription className="mt-2">{packageRecord.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {buildPackageHighlights(packageRecord).map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-border bg-surface-subtle p-4">
                <div className="flex items-center gap-2 text-primary">
                  <BadgeIndianRupee className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-[0.2em]">Pricing</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{packageRecord.priceLabel}</p>
              </div>
              <div className="rounded-[1.4rem] border border-border bg-surface-subtle p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-[0.2em]">Turnaround</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{packageRecord.turnaroundText}</p>
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-border p-4">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Best fit</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted">{packageRecord.audience}</p>
            </div>
            <Button
              className="w-full justify-between"
              variant={packageRecord.id === activePackageId ? "primary" : "secondary"}
              onClick={() => onSelect(packageRecord.id)}
            >
              {packageRecord.id === activePackageId ? "Selected package" : "Choose this package"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
