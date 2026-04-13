"use client";

import { taxPeriodOptions } from "@/features/tax-center/tax-utils";
import type { TaxPeriod } from "@/types/finance";

type TaxPeriodPillsProps = {
  period: TaxPeriod;
  isLoading: boolean;
  onChange: (period: TaxPeriod) => void;
};

export function TaxPeriodPills({ period, isLoading, onChange }: TaxPeriodPillsProps) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {taxPeriodOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={isLoading}
          onClick={() => onChange(option.value)}
          className={`rounded-[1.5rem] border p-5 text-left transition ${
            option.value === period
              ? "border-primary/30 bg-primary/6 shadow-sm"
              : "border-border bg-surface hover:border-primary/20 hover:bg-surface-subtle"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
                <p className="text-sm font-semibold text-foreground">{option.label}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{option.description}</p>
              </div>
            {option.value === period ? (
              <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Active
              </span>
            ) : null}
          </div>
        </button>
      ))}
    </section>
  );
}
