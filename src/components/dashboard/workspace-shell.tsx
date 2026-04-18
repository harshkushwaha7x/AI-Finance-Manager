"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import { ChevronRight, Command, Search } from "lucide-react";

import { NotificationsLink } from "@/components/dashboard/notifications-link";
import { WorkspaceCommandPalette } from "@/components/dashboard/workspace-command-palette";
import { AppLogo } from "@/components/shared/app-logo";
import { Button } from "@/components/ui/button";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";
import type { WorkspaceCommandAction } from "@/lib/constants/site";
import { publicConfig } from "@/lib/public-config";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
};

type WorkspaceShellProps = {
  children: ReactNode;
  navigation: NavItem[];
  commandActions: WorkspaceCommandAction[];
  label: string;
  accentClassName?: string;
};

function ClerkWorkspaceControls() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <Button asChild variant="secondary">
        <Link href={publicConfig.signInUrl}>Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="rounded-full border border-black/6 bg-surface p-1 shadow-sm">
      <UserButton appearance={clerkAppearance} />
    </div>
  );
}

export function WorkspaceShell({
  children,
  navigation,
  commandActions,
  label,
  accentClassName = "bg-primary/10 text-primary",
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, segments) => ({
      href: `/${segments.slice(0, index + 1).join("/")}`,
      label: segment
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    }));

  return (
    <div className="min-h-screen bg-[#f3f0e7]">
      <WorkspaceCommandPalette
        open={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
        navigation={navigation}
        actions={commandActions}
      />
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-black/6 bg-surface/80 p-6 backdrop-blur-xl lg:block">
          <div className="flex h-full flex-col">
            <AppLogo />
            <div
              className={cn(
                "mt-8 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]",
                accentClassName,
              )}
            >
              {label}
            </div>
            <nav className="mt-8 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-foreground text-white shadow-lg shadow-foreground/12"
                        : "text-muted hover:bg-foreground/5 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto rounded-[1.8rem] border border-black/6 bg-surface-subtle p-5">
              <p className="font-display text-xl font-bold text-foreground">Sprint focus</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Ship visually obvious progress first, then stack backend, AI, and admin depth on top.
              </p>
            </div>
          </div>
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-black/6 bg-background/85 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <AppLogo className="lg:hidden" />
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">{label}</p>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                  AI Finance Manager workspace
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center gap-2">
                      {index > 0 ? <ChevronRight className="h-4 w-4 text-muted/60" /> : null}
                      <Link href={crumb.href} className="transition hover:text-foreground">
                        {crumb.label}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setIsPaletteOpen(true)}
                  className="flex items-center gap-3 rounded-2xl border border-black/6 bg-surface px-4 py-3 text-left text-sm text-muted transition hover:border-primary/25 hover:bg-surface-subtle"
                >
                  <Search className="h-4 w-4" />
                  <span>Search routes, reports, and requests</span>
                  <span className="rounded-lg bg-foreground/5 px-2 py-1 font-mono text-xs">Ctrl K</span>
                </button>
                <NotificationsLink />
                <Button
                  variant="primary"
                  className="justify-start gap-2"
                  onClick={() => setIsPaletteOpen(true)}
                >
                  <Command className="h-4 w-4" />
                  Quick action
                </Button>
                {publicConfig.hasClerk ? (
                  <ClerkWorkspaceControls />
                ) : (
                  <div className="inline-flex rounded-full border border-dashed border-primary/25 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Demo mode
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 px-5 py-8 sm:px-8">
            {!publicConfig.hasClerk ? (
              <div className="mb-6 rounded-[1.6rem] border border-dashed border-primary/20 bg-primary/8 px-5 py-4 text-sm leading-7 text-muted">
                Clerk is not configured yet, so the workspace is running in demo mode. Add your auth keys
                to enable protected sessions, user menus, and role-based access.
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
