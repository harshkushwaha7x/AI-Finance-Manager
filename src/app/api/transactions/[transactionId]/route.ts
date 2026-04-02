import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  deleteTransaction,
  getSerializedTransactionsCookie,
  getTransactionCookieOptions,
  transactionCookieName,
  updateTransaction,
} from "@/lib/services/transactions";
import { transactionInputSchema } from "@/lib/validations/finance";

type RouteContext = {
  params: Promise<unknown>;
};

async function getTransactionIdFromContext(params: RouteContext["params"]) {
  const resolvedParams = await params;

  if (
    !resolvedParams ||
    typeof resolvedParams !== "object" ||
    !("transactionId" in resolvedParams) ||
    typeof resolvedParams.transactionId !== "string"
  ) {
    return null;
  }

  return resolvedParams.transactionId;
}

export async function PATCH(request: Request, { params }: RouteContext) {
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

  const transactionId = await getTransactionIdFromContext(params);

  if (!transactionId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Transaction id is required.",
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const result = await updateTransaction(viewer, transactionId, parsed.data);

  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        message: "Transaction not found.",
      },
      { status: 404 },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      message: "Transaction updated.",
      transaction: result.transaction,
      summary: result.summary,
      categories: result.categories,
      source: result.source,
    },
    { status: 200 },
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

export async function DELETE(_: Request, { params }: RouteContext) {
  const transactionId = await getTransactionIdFromContext(params);

  if (!transactionId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Transaction id is required.",
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const result = await deleteTransaction(viewer, transactionId);

  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        message: "Transaction not found.",
      },
      { status: 404 },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      message: "Transaction deleted.",
      deletedId: transactionId,
      summary: result.summary,
      source: result.source,
    },
    { status: 200 },
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
