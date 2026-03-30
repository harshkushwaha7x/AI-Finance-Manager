import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  delta?: string;
  deltaTone?: "success" | "warning" | "danger" | "secondary";
};

export function StatCard({
  label,
  value,
  detail,
  delta,
  deltaTone = "secondary",
}: StatCardProps) {
  const isPositive = deltaTone === "success" || deltaTone === "secondary";

  return (
    <Card className="motion-rise-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted">{label}</p>
          {delta ? (
            <Badge variant={deltaTone} className="gap-1">
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {delta}
            </Badge>
          ) : null}
        </div>
        <p className="font-display text-3xl font-bold tracking-tight text-foreground">{value}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-7 text-muted">{detail}</p>
      </CardContent>
    </Card>
  );
}
