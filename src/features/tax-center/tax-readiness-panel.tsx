import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getChecklistVariant } from "@/features/tax-center/tax-utils";
import type { TaxChecklistItem } from "@/types/finance";

type TaxReadinessPanelProps = {
  checklist: TaxChecklistItem[];
};

export function TaxReadinessPanel({ checklist }: TaxReadinessPanelProps) {
  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Readiness checklist</p>
        <CardTitle className="mt-3">What still needs attention</CardTitle>
        <CardDescription className="mt-2">
          This is the tax prep punch list you can actually work through before handing things to an accountant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="rounded-[1.4rem] border border-border bg-surface-subtle p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
              </div>
              <Badge variant={getChecklistVariant(item.status)}>{item.status}</Badge>
            </div>
            {item.detail ? (
              <p className="mt-3 text-sm leading-7 text-muted">{item.detail}</p>
            ) : null}
            {item.ctaHref && item.ctaLabel ? (
              <Link
                href={item.ctaHref}
                className="mt-4 inline-flex text-sm font-semibold text-primary transition hover:text-primary-strong"
              >
                {item.ctaLabel}
              </Link>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
