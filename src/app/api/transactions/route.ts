import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  createTransaction,
  getSerializedTransactionsCookie,
  getTransactionCookieOptions,
  getTransactionWorkspaceState,
  transactionCookieName,
} from "@/lib/services/transactions";
import { transactionFiltersSchema, transactionInputSchema } from "@/lib/validations/finance";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const parsedFilters = transactionFiltersSchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  });

  if (!parsedFilters.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid transaction filters.",
        errors: parsedFilters.error.flatten(),
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const workspaceState = await getTransactionWorkspaceState(viewer, parsedFilters.data);

  return NextResponse.json(
    {
      ok: true,
      ...workspaceState,
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = transactionInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Validation failed.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const result = await createTransaction(viewer, parsed.data);
  const response = NextResponse.json(
    {
      ok: true,
      message: "Transaction created.",
      transaction: result.transaction,
      summary: result.summary,
      categories: result.categories,
      source: result.source,
    },
    { status: 201 },
  );

  if (result.source === "demo") {
    response.cookies.set(
      transactionCookieName,
      getSerializedTransactionsCookie(result.transactions),
      getTransactionCookieOptions(),
    );
  }

  return response;
}
