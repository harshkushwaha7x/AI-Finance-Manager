import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  deleteInvoice,
  getInvoiceCookieOptions,
  getSerializedInvoicesCookie,
  invoiceCookieName,
  updateInvoice,
} from "@/lib/services/invoices";
import {
  getSerializedTransactionsCookie,
  getTransactionCookieOptions,
  transactionCookieName,
} from "@/lib/services/transactions";
import { invoiceInputSchema } from "@/lib/validations/finance";

type RouteContext = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { invoiceId } = await context.params;
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
    const result = await updateInvoice(viewer, invoiceId, parsed.data);

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invoice not found.",
        },
        { status: 404 },
      );
    }

    const response = NextResponse.json(
      {
        ok: true,
        message: "Invoice updated.",
        invoice: result.invoice,
        invoices: result.invoices,
        summary: result.summary,
        source: result.source,
      },
      { status: 200 },
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
        message: error instanceof Error ? error.message : "Unable to update invoice.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { invoiceId } = await context.params;
  const viewer = await getViewerContext();
  const result = await deleteInvoice(viewer, invoiceId);

  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invoice not found.",
      },
      { status: 404 },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      message: "Invoice deleted.",
      invoices: result.invoices,
      summary: result.summary,
      source: result.source,
    },
    { status: 200 },
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
}
