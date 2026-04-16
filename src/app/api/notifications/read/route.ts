import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  getNotificationReadCookieOptions,
  getSerializedNotificationReadStateCookie,
  notificationReadCookieName,
  updateNotificationReadState,
} from "@/lib/services/notifications";
import { notificationReadInputSchema } from "@/lib/validations/finance";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = notificationReadInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid notification read payload.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const viewer = await getViewerContext();
    const result = await updateNotificationReadState(viewer, parsed.data);
    const response = NextResponse.json(
      {
        ok: true,
        message: parsed.data.markAll ? "Notifications updated." : "Notification state updated.",
        ...result,
      },
      { status: 200 },
    );

    if (result.source === "demo") {
      response.cookies.set(
        notificationReadCookieName,
        getSerializedNotificationReadStateCookie(result.persistedReadState),
        getNotificationReadCookieOptions(),
      );
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to update notifications.",
      },
      { status: 400 },
    );
  }
}
