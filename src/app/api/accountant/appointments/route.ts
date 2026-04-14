import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  appointmentCookieName,
  createAppointment,
  getAppointmentCookieOptions,
  getBookingWorkspaceState,
  getSerializedAccountantRequestsCookieForAppointments,
  getSerializedAppointmentsCookie,
} from "@/lib/services/appointments";
import {
  accountantRequestCookieName,
} from "@/lib/services/accountant";
import { appointmentInputSchema } from "@/lib/validations/finance";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getBookingWorkspaceState(viewer);

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
  const parsed = appointmentInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid appointment payload.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const viewer = await getViewerContext();
    const result = await createAppointment(viewer, parsed.data);
    const response = NextResponse.json(
      {
        ok: true,
        message: "Appointment created.",
        appointment: result.appointment,
        appointments: result.appointments,
        requests: result.requests,
        summary: result.summary,
        source: result.source,
      },
      { status: 201 },
    );

    if (result.source === "demo") {
      response.cookies.set(
        appointmentCookieName,
        getSerializedAppointmentsCookie(result.persistedAppointments),
        getAppointmentCookieOptions(),
      );
      response.cookies.set(
        accountantRequestCookieName,
        getSerializedAccountantRequestsCookieForAppointments(result.persistedRequests),
        getAppointmentCookieOptions(),
      );
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to create the appointment.",
      },
      { status: 400 },
    );
  }
}
