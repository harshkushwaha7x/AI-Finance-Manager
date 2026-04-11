import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  createInvoice,
  getInvoiceCookieOptions,
  getInvoiceWorkspaceState,
  getSerializedInvoicesCookie,
  invoiceCookieName,
} from "@/lib/services/invoices";
import {
  getSerializedTransactionsCookie,
  getTransactionCookieOptions,
  transactionCookieName,
} from "@/lib/services/transactions";
import { invoiceInputSchema } from "@/lib/validations/finance";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getInvoiceWorkspaceState(viewer);

  return NextResponse.json(
    {
      ok: true,
      ...workspaceState,
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = invoiceInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid invoice payload.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const viewer = await getViewerContext();
    const result = await createInvoice(viewer, parsed.data);
    const response = NextResponse.json(
      {
        ok: true,
        message: "Invoice created.",
        invoice: result.invoice,
        invoices: result.invoices,
        summary: result.summary,
        source: result.source,
      },
      { status: 201 },
    );

    if (result.source === "demo") {
      response.cookies.set(
        invoiceCookieName,
        getSerializedInvoicesCookie(result.persistedInvoices),
        getInvoiceCookieOptions(),
      );

      if (result.syncedTransactions) {
        response.cookies.set(
          transactionCookieName,
          getSerializedTransactionsCookie(result.syncedTransactions),
          getTransactionCookieOptions(),
        );
      }
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to create invoice.",
      },
      { status: 400 },
    );
  }
}
