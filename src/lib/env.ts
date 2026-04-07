const DEFAULT_APP_URL = "http://localhost:3000";
const databaseUrl = process.env.DATABASE_URL ?? "";
const isPlaceholderDatabaseUrl =
  databaseUrl.includes("johndoe:randompassword") ||
  databaseUrl.includes("localhost:5432/mydb");

export const appEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL,
  hasClerk: Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  ),
  hasDatabase: Boolean(databaseUrl) && !isPlaceholderDatabaseUrl,
  hasSupabase: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  hasSupabaseStorageAdmin: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
  supabaseStorageBucket:
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "finance-documents",
  hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
};

export function getPublicAppUrl() {
  return appEnv.appUrl;
}
