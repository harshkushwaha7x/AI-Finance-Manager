# Clerk Auth Setup

## Required environment variables

Add these values to `.env.local` before enabling live authentication:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
DEMO_ADMIN_EMAILS=you@example.com
```

## Route protection

- `src/proxy.ts` protects `/dashboard(.*)` and `/admin(.*)` when Clerk is configured.
- Admin routes expect a Clerk role claim of `admin`.
- During local demo mode, the repo falls back gracefully so the product shell still renders without auth keys.

## Admin access

Use one of these approaches for admin testing:

- Set Clerk public metadata or session metadata role to `admin`
- Add your email to `DEMO_ADMIN_EMAILS`

## Local workflow

```bash
npm install
npm run dev
```

After Clerk is configured, the branded `/sign-in` and `/sign-up` routes will host the real auth widgets instead of the setup fallback card.
