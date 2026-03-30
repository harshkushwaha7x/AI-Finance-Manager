import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

import { AuthSetupCard } from "@/components/auth/auth-setup-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";
import { buildMetadata } from "@/lib/metadata";
import { publicConfig } from "@/lib/public-config";

export const metadata: Metadata = buildMetadata({
  title: "Sign In",
  description:
    "Sign in to access the AI Finance Manager dashboard, review finance workflows, and continue through the protected SaaS experience.",
  path: "/sign-in",
});

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue into the finance workspace, review the dashboard shell, and step into the protected product experience."
      ctaLabel="Sign in"
      altHref="/sign-up"
      altLabel="Need an account? Open sign up"
      note={
        publicConfig.hasClerk
          ? "Clerk is configured for this route, so the branded shell now hosts the real auth flow."
          : "Add your Clerk environment variables to replace setup mode with a live sign-in experience."
      }
    >
      {publicConfig.hasClerk ? (
        <SignIn appearance={clerkAppearance} signUpUrl="/sign-up" />
      ) : (
        <AuthSetupCard
          title="Clerk setup needed"
          description="Add Clerk publishable and secret keys in your local environment to activate sign-in for this route."
        />
      )}
    </AuthShell>
  );
}
