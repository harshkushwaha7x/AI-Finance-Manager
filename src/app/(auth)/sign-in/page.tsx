import { AuthShell } from "@/components/auth/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue into the finance workspace, review dashboard progress, and prepare for upcoming Clerk-based authentication."
      ctaLabel="Sign in"
      altHref="/sign-up"
      altLabel="Need an account? Open sign up"
    />
  );
}
