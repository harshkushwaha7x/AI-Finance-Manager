import { StatCard } from "@/components/shared/stat-card";
import { formatTaxCurrency, getReadinessTone } from "@/features/tax-center/tax-utils";
import type { TaxWorkspaceState } from "@/types/finance";

type TaxSummaryStripProps = {
  summary: TaxWorkspaceState["summary"];
};

export function TaxSummaryStrip({ summary }: TaxSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Output GST"
        value={formatTaxCurrency(summary.outputTax)}
        detail="GST collected across invoices inside the active tax period."
      />
      <StatCard
        label="Input Tax"
        value={formatTaxCurrency(summary.estimatedInputTax)}
        detail="Estimated from reviewed receipt and bill extraction data."
      />
      <StatCard
        label="Net Position"
        value={formatTaxCurrency(summary.netTaxPosition)}
        detail="Output tax minus currently visible input-tax support."
        delta={summary.netTaxPosition >= 0 ? "Payable" : "Credit"}
        deltaTone={summary.netTaxPosition >= 0 ? "warning" : "success"}
      />
      <StatCard
        label="Readiness"
        value={`${summary.readinessScore}/100`}
        detail={`Tax reserve currently tracked at ${formatTaxCurrency(summary.taxReserveAmount)}.`}
        delta={
          summary.readinessScore >= 80
            ? "Ready"
            : summary.readinessScore >= 55
              ? "Watch"
              : "Needs work"
        }
        deltaTone={getReadinessTone(summary.readinessScore)}
      />
    </section>
  );
}
