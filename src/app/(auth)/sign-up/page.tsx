import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your workspace"
      description="This route is already branded and structured for auth, so Clerk can be integrated later without redesigning the entry experience."
      ctaLabel="Create account"
      altHref="/sign-in"
      altLabel="Already have an account? Open sign in"
    />
  );
}
