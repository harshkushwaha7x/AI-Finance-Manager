"use client";

import { StatCard } from "@/components/shared/stat-card";
import { buildInsightStatCards } from "@/features/insights/insight-utils";
import type { InsightHistoryRecord } from "@/types/finance";

type InsightSummaryStripProps = {
  current: InsightHistoryRecord;
};

export function InsightSummaryStrip({ current }: InsightSummaryStripProps) {
  const cards = buildInsightStatCards(current);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          detail={card.detail}
          delta={card.delta}
          deltaTone={card.deltaTone}
        />
      ))}
    </section>
  );
}
