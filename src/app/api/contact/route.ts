import { NextResponse } from "next/server";

import {
  contactLeadCookieName,
  createContactLead,
  getContactLeadCookieOptions,
  getSerializedContactLeadsCookie,
} from "@/lib/services/contact-leads";
import { contactLeadSchema } from "@/lib/validations/contact";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
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

  const result = await createContactLead(parsed.data);
  const response = NextResponse.json(
    {
      ok: true,
      message:
        result.source === "database"
          ? "Lead stored and visible to admin."
          : "Lead captured in the demo admin pipeline.",
      lead: result.lead,
      source: result.source,
    },
    { status: 202 },
  );

  if (result.source === "demo") {
    response.cookies.set(
      contactLeadCookieName,
      getSerializedContactLeadsCookie(result.persistedLeads),
      getContactLeadCookieOptions(),
    );
  }

  return response;
}
