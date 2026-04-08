"use client";

import { Workflow } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TransactionRuleRecord } from "@/types/finance";

type TransactionRuleListProps = {
  rules: TransactionRuleRecord[];
};

export function TransactionRuleList({ rules }: TransactionRuleListProps) {
  return (
    <Card className="rounded-[1.6rem]">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Rule engine</p>
          <CardTitle className="mt-3">Saved automation rules</CardTitle>
          <CardDescription>
            Merchant, title, and description matches can auto-categorize new transactions.
          </CardDescription>
        </div>
        <div className="rounded-2xl bg-primary/8 p-3 text-primary">
          <Workflow className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.length ? (
          rules.slice(0, 6).map((rule) => (
            <div
              key={rule.id}
              className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{rule.matchField}</Badge>
                <Badge variant="neutral">{rule.categoryLabel}</Badge>
                <Badge variant={rule.createdBy === "ai" ? "primary" : "success"}>
                  {rule.createdBy === "ai" ? "AI seeded" : "Manual"}
                </Badge>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{rule.matchValue}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.3rem] border border-dashed border-black/8 bg-surface-subtle p-5">
            <p className="font-medium text-foreground">No saved rules yet</p>
            <p className="mt-2 text-sm leading-7 text-muted">
              Approving AI suggestions with rule saving enabled will start building automations here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
