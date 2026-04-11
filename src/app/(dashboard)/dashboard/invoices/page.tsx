import { InvoicesWorkspace } from "@/features/invoices/invoices-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getInvoiceWorkspaceState } from "@/lib/services/invoices";

export default async function InvoicesPage() {
  const viewer = await getViewerContext();
  const invoiceWorkspaceState = await getInvoiceWorkspaceState(viewer);

  return <InvoicesWorkspace initialState={invoiceWorkspaceState} />;
}
