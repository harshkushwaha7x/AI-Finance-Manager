# AI Finance Manager

AI Finance Manager is a startup-style full-stack fintech SaaS concept built to showcase premium product design, realistic finance workflows, AI-assisted automation, and service operations in one portfolio-ready repository.

## Product direction

- India-first money management and accountant service platform
- Personal finance + freelancer finance + small business accounting workflows
- AI-assisted categorization, insights, document understanding, and finance chat
- Premium marketing site, dashboard workspace, and internal admin surfaces

## Current implementation

This first milestone ships the product foundation:

- Next.js App Router application bootstrap
- premium marketing homepage and supporting marketing pages
- branded sign-in and sign-up route shells
- dashboard workspace shell with routed product sections
- admin workspace shell for service operations
- contact form with validated demo route handler
- environment scaffolding and project constants for future backend integrations

## Planned stack

- Next.js + React + TypeScript
- Tailwind CSS + custom component primitives
- Prisma + PostgreSQL
- Clerk for authentication
- Supabase for storage and database hosting
- OpenAI for categorization, insights, OCR, and chat
- Vercel for deployment

## Routes already scaffolded

### Marketing

- `/`
- `/about`
- `/services`
- `/pricing`
- `/contact`
- `/privacy`
- `/terms`

### Auth

- `/sign-in`
- `/sign-up`

### Product

- `/dashboard`
- `/dashboard/transactions`
- `/dashboard/expenses`
- `/dashboard/income`
- `/dashboard/budgets`
- `/dashboard/goals`
- `/dashboard/documents`
- `/dashboard/receipts`
- `/dashboard/invoices`
- `/dashboard/tax-center`
- `/dashboard/insights`
- `/dashboard/ai-assistant`
- `/dashboard/reports`
- `/dashboard/accountant`
- `/dashboard/bookings`
- `/dashboard/notifications`
- `/dashboard/profile`
- `/dashboard/settings`

### Admin

- `/admin`
- `/admin/leads`
- `/admin/packages`
- `/admin/users`
- `/admin/reports`

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`

## Environment variables

These variables are already scaffolded for later milestones:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## Roadmap

The active build strategy is documented in [docs/roadmap.md](/docs/roadmap.md).

## Why this project matters for a portfolio

- demonstrates product thinking, not just feature coding
- shows how marketing, app UX, backend routes, and admin operations fit together
- creates a believable SaaS narrative for recruiters and clients
- supports consistent daily GitHub progress with small, meaningful feature slices
