import { auth, currentUser } from "@clerk/nextjs/server";

import { appEnv } from "@/lib/env";

type ViewerContext = {
  hasClerk: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  email: string | null;
  name: string | null;
};

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

function getAdminEmailSet() {
  return new Set(
    (process.env.DEMO_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function getViewerContext(): Promise<ViewerContext> {
  if (!appEnv.hasClerk) {
    return {
      hasClerk: false,
      isSignedIn: false,
      isAdmin: false,
      email: null,
      name: null,
    };
  }

  const authState = await auth();

  if (!authState.userId) {
    return {
      hasClerk: true,
      isSignedIn: false,
      isAdmin: false,
      email: null,
      name: null,
    };
  }

  const user = await currentUser();
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;
  const metadataRole = getMetadataRole(authState.sessionClaims);
  const adminEmails = getAdminEmailSet();
  const isAdmin =
    metadataRole === "admin" ||
    (primaryEmail ? adminEmails.has(primaryEmail.toLowerCase()) : false);

  return {
    hasClerk: true,
    isSignedIn: true,
    isAdmin,
    email: primaryEmail,
    name: user?.fullName ?? user?.firstName ?? null,
  };
}
