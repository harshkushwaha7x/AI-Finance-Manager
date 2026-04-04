"use client";

import { cn } from "@/lib/utils";
import type { BudgetSavedView, BudgetSavedViewId } from "@/types/budgets";

type BudgetSavedViewsProps = {
  views: BudgetSavedView[];
  activeView: BudgetSavedViewId;
  onSelect: (viewId: BudgetSavedViewId) => void;
};

export function BudgetSavedViews({
  views,
  activeView,
  onSelect,
}: BudgetSavedViewsProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Saved views</p>
        <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
          Move between healthy, watchlist, and quarterly plans fast
        </h3>
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        {views.map((view) => {
          const isActive = view.id === activeView;

          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onSelect(view.id)}
              className={cn(
                "rounded-[1.5rem] border p-5 text-left transition",
                isActive
                  ? "border-primary bg-primary/8 shadow-lg shadow-primary/10"
                  : "border-black/6 bg-surface hover:border-primary/30",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{view.label}</p>
                  <p className="mt-2 text-sm leading-7 text-muted">{view.description}</p>
                </div>
                <div className="rounded-full border border-black/8 bg-surface-subtle px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {view.count}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
