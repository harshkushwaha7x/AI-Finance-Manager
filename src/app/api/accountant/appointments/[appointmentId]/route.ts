import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  appointmentCookieName,
  getAppointmentCookieOptions,
  getSerializedAccountantRequestsCookieForAppointments,
  getSerializedAppointmentsCookie,
  updateAppointment,
} from "@/lib/services/appointments";
import { accountantRequestCookieName } from "@/lib/services/accountant";
import { appointmentUpdateSchema } from "@/lib/validations/finance";

type RouteContext = {
  params: Promise<unknown>;
};

async function getAppointmentIdFromContext(params: RouteContext["params"]) {
  const resolvedParams = await params;

  if (
    !resolvedParams ||
    typeof resolvedParams !== "object" ||
    !("appointmentId" in resolvedParams) ||
    typeof resolvedParams.appointmentId !== "string"
  ) {
    return null;
  }

  return resolvedParams.appointmentId;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const appointmentId = await getAppointmentIdFromContext(params);

  if (!appointmentId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Appointment id is required.",
      },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = appointmentUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid appointment update payload.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const viewer = await getViewerContext();
    const result = await updateAppointment(viewer, appointmentId, parsed.data);

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          message: "Appointment not found.",
        },
        { status: 404 },
      );
    }

    const response = NextResponse.json(
      {
        ok: true,
        message: "Appointment updated.",
        appointment: result.appointment,
        appointments: result.appointments,
        requests: result.requests,
        summary: result.summary,
        source: result.source,
      },
      { status: 200 },
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
          error instanceof Error ? error.message : "Unable to update the appointment.",
      },
      { status: 400 },
    );
  }
}
