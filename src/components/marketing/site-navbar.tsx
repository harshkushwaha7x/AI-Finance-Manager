import Link from "next/link";

import { AppLogo } from "@/components/shared/app-logo";
import { SiteContainer } from "@/components/shared/site-container";
import { Button } from "@/components/ui/button";
import { marketingNav } from "@/lib/constants/site";

export function SiteNavbar() {
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
        </div>
      </SiteContainer>
    </header>
  );
}
