import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

function getMetadataRole(sessionClaims: unknown) {
  if (!sessionClaims || typeof sessionClaims !== "object" || !("metadata" in sessionClaims)) {
    return null;
  }

  const metadata = sessionClaims.metadata;

  if (!metadata || typeof metadata !== "object" || !("role" in metadata)) {
    return null;
  }

  return typeof metadata.role === "string" ? metadata.role : null;
}

const clerkProxy = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  const authState = await auth();
  const metadataRole = getMetadataRole(authState.sessionClaims);

  if (isAdminRoute(request) && metadataRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
});

export default function proxy(
  request: Parameters<typeof clerkProxy>[0],
  event: Parameters<typeof clerkProxy>[1],
) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.next();
  }

  return clerkProxy(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
