"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { AppLogo } from "@/components/shared/app-logo";
import { SiteContainer } from "@/components/shared/site-container";
import { Button } from "@/components/ui/button";
import { marketingNav } from "@/lib/constants/site";

export function SiteNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-background/80 backdrop-blur-xl">
      <SiteContainer className="flex h-20 items-center justify-between gap-6">
        <Link href="/" aria-label="Go to home">
          <AppLogo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted lg:flex">
          {marketingNav.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Open demo workspace</Link>
          </Button>
          <button
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-surface text-foreground transition hover:border-primary/30 lg:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </SiteContainer>
      {isOpen ? (
        <SiteContainer className="pb-5 lg:hidden">
          <div className="rounded-[1.75rem] border border-black/6 bg-surface p-4 shadow-[0_20px_70px_-58px_rgba(17,24,39,0.55)]">
            <nav className="space-y-2">
              {marketingNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex rounded-2xl px-4 py-3 text-sm font-medium text-muted transition hover:bg-foreground/5 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 grid gap-3">
              <Button asChild variant="secondary" className="w-full">
                <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  Open demo workspace
                </Link>
              </Button>
            </div>
          </div>
        </SiteContainer>
      ) : null}
    </header>
  );
}
