import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvoiceSavedView, InvoiceSavedViewId } from "@/types/invoices";

type InvoiceSavedViewsProps = {
  views: InvoiceSavedView[];
  activeView: InvoiceSavedViewId;
  onSelect: (viewId: InvoiceSavedViewId) => void;
};

export function InvoiceSavedViews({
  views,
  activeView,
  onSelect,
}: InvoiceSavedViewsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-5">
      {views.map((view) => {
        const isActive = activeView === view.id;

        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onSelect(view.id)}
            className="text-left"
          >
            <Card
              className={
                isActive
                  ? "rounded-[1.6rem] border-primary/30 bg-primary/5 shadow-lg shadow-primary/10"
                  : "rounded-[1.6rem]"
              }
            >
              <CardHeader>
                <p className="text-xs uppercase tracking-[0.22em] text-primary">{view.count}</p>
                <CardTitle className="mt-3 text-lg">{view.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-muted">{view.description}</p>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </section>
  );
}
