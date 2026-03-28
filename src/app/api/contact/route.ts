import { NextResponse } from "next/server";

import { contactLeadSchema } from "@/lib/validations/contact";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = contactLeadSchema.safeParse(body);

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

  return NextResponse.json(
    {
      ok: true,
      message: "Lead received by the demo route.",
      lead: parsed.data,
    },
    { status: 202 },
  );
}
