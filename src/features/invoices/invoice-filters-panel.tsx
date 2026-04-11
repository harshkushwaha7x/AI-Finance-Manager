import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { InvoicePageFilters } from "@/types/invoices";

type InvoiceFiltersPanelProps = {
  filters: InvoicePageFilters;
  onFiltersChange: (filters: InvoicePageFilters) => void;
  onReset: () => void;
};

export function InvoiceFiltersPanel({
  filters,
  onFiltersChange,
  onReset,
}: InvoiceFiltersPanelProps) {
  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <CardTitle>Filter the invoice lane</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-[1fr_12rem_auto] md:items-end">
        <FormField label="Search" htmlFor="invoice-search">
          <Input
            id="invoice-search"
            value={filters.search}
            placeholder="Invoice number, client, or GSTIN"
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                search: event.target.value,
              })
            }
          />
        </FormField>
        <FormField label="Status" htmlFor="invoice-status">
          <Select
            id="invoice-status"
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target.value as InvoicePageFilters["status"],
              })
            }
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </FormField>
        <button
          type="button"
          onClick={onReset}
          className="h-12 rounded-2xl border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-surface-subtle"
        >
          Reset
        </button>
      </CardContent>
    </Card>
  );
}
