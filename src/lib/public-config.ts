export const publicConfig = {
  hasClerk: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up",
  dashboardUrl: "/dashboard",
};
