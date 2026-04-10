"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InsightListCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
  emptyMessage: string;
};

export function InsightListCard({
  eyebrow,
  title,
  description,
  items,
  emptyMessage,
}: InsightListCardProps) {
  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <CardTitle className="mt-3">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={item}
              className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4 text-sm leading-7 text-foreground"
            >
              {item}
            </div>
          ))
        ) : (
          <div className="rounded-[1.3rem] border border-dashed border-black/8 bg-surface-subtle p-4 text-sm leading-7 text-muted">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
