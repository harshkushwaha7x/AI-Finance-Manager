import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { onboardingCookieName } from "@/lib/onboarding/constants";
import {
  createOnboardingCookiePayload,
  persistOnboardingToDatabase,
} from "@/lib/onboarding/server";
import { onboardingInputSchema } from "@/lib/validations/onboarding";

function getAnonymousViewer(): ViewerContext {
  return {
    hasClerk: false,
    isSignedIn: false,
    isAdmin: false,
    clerkUserId: null,
    email: null,
    name: null,
  };
}

async function getRouteViewer() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return getAnonymousViewer();
  }

  const authState = await auth();
  const user = authState.userId ? await currentUser() : null;
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  return {
    hasClerk: true,
    isSignedIn: Boolean(authState.userId),
    isAdmin: false,
    clerkUserId: authState.userId ?? null,
    email: primaryEmail,
    name: user?.fullName ?? user?.firstName ?? null,
  } satisfies ViewerContext;
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = onboardingInputSchema.safeParse(body);

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

  const viewer = await getRouteViewer();
  const databaseResult = await persistOnboardingToDatabase(parsed.data, viewer);
  const cookiePayload = createOnboardingCookiePayload(parsed.data);
  const response = NextResponse.json(
    {
      ok: true,
      message: databaseResult.persisted
        ? "Onboarding saved to the database and demo snapshot."
        : "Onboarding saved to the demo snapshot.",
      onboarding: cookiePayload,
      persistedToDatabase: databaseResult.persisted,
    },
    { status: 200 },
  );

  response.cookies.set(onboardingCookieName, JSON.stringify(cookiePayload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const viewer = await getRouteViewer();

  if (viewer.isSignedIn && viewer.email) {
    try {
      const prisma = getPrismaClient();

      if (!prisma) {
        throw new Error("Database not configured.");
      }

      await prisma.user.updateMany({
        where: { email: viewer.email },
        data: { onboardingCompleted: false },
      });
    } catch {
      // Ignore database reset failures in demo mode.
    }
  }

  const response = NextResponse.json(
    {
      ok: true,
      message: "Onboarding reset.",
    },
    { status: 200 },
  );

  response.cookies.delete(onboardingCookieName);

  return response;
}
