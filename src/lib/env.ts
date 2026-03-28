const DEFAULT_APP_URL = "http://localhost:3000";

export const appEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL,
  hasClerk: Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  ),
  hasDatabase: Boolean(process.env.DATABASE_URL),
  hasSupabase: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
};

export function getPublicAppUrl() {
  return appEnv.appUrl;
}
