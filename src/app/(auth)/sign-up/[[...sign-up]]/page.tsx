import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

import { AuthSetupCard } from "@/components/auth/auth-setup-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";
import { buildMetadata } from "@/lib/metadata";
import { publicConfig } from "@/lib/public-config";

export const metadata: Metadata = buildMetadata({
  title: "Sign Up",
  description:
    "Create an account to enter the AI Finance Manager workspace, explore product flows, and onboard into the premium finance platform.",
  path: "/sign-up",
});

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your workspace"
      description="Start with a polished sign-up experience that matches the rest of the product and can expand into onboarding without redesigning the entry flow."
      ctaLabel="Create account"
      altHref="/sign-in"
      altLabel="Already have an account? Open sign in"
      note={
        publicConfig.hasClerk
          ? "This route is now Clerk-ready and styled to match the rest of the product shell."
          : "Configure Clerk in your environment to switch this page from setup mode to live sign-up."
      }
    >
      {publicConfig.hasClerk ? (
        <SignUp appearance={clerkAppearance} signInUrl="/sign-in" />
      ) : (
        <AuthSetupCard
          title="Clerk setup needed"
          description="Add Clerk publishable and secret keys in your local environment to activate sign-up for this route."
        />
      )}
    </AuthShell>
  );
}
