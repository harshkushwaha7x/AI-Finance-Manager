import type { ReactNode } from "react";
import Link from "next/link";

import { AppLogo } from "@/components/shared/app-logo";
import { Button } from "@/components/ui/button";

type AuthShellProps = {
  title: string;
  description: string;
  ctaLabel: string;
  altHref: string;
  altLabel: string;
  note?: string;
  children?: ReactNode;
};

const benefits = [
  "Premium dashboard access",
  "AI finance workflow previews",
  "Accountant service request lane",
];

export function AuthShell({
  title,
  description,
  ctaLabel,
  altHref,
  altLabel,
  note,
  children,
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-foreground p-10 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(21,94,239,0.35),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.35),transparent_32%)]" />
        <div className="relative flex h-full flex-col justify-between">
          <AppLogo className="[&_p:last-child]:text-white/60 [&_p:first-child]:text-white [&>div:first-child]:bg-white [&>div:first-child]:text-foreground" />
          <div>
            <p className="font-display text-5xl font-bold tracking-tight">
              Ship a fintech product story that feels recruiter-ready from day one.
            </p>
            <div className="mt-10 space-y-4">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/78"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md rounded-[2rem] border border-black/6 bg-surface p-8 shadow-[0_24px_90px_-60px_rgba(17,24,39,0.6)]">
          <AppLogo className="lg:hidden" />
          <p className="mt-8 font-display text-3xl font-bold tracking-tight text-foreground">{title}</p>
          <p className="mt-4 text-base leading-8 text-muted">{description}</p>
          {children ? (
            <div className="mt-8">{children}</div>
          ) : (
            <div className="mt-8 space-y-3">
              <button className="flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-background text-sm font-semibold text-foreground transition hover:border-primary/35">
                {ctaLabel} with email
              </button>
              <button className="flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-white transition hover:bg-black/90">
                Continue with Google
              </button>
            </div>
          )}
          <p className="mt-6 text-sm text-muted">
            {note ?? "Clerk integration is the next planned milestone for this route shell."}
          </p>
          <Button asChild variant="ghost" className="mt-5 px-0 text-primary">
            <Link href={altHref}>{altLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
