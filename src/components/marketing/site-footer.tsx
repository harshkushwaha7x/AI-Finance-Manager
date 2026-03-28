import Link from "next/link";

import { AppLogo } from "@/components/shared/app-logo";
import { SiteContainer } from "@/components/shared/site-container";
import { marketingNav, siteConfig } from "@/lib/constants/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-surface">
      <SiteContainer className="grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <AppLogo />
          <p className="max-w-xl text-sm leading-7 text-muted">{siteConfig.description}</p>
          <p className="text-sm text-muted">Built as a startup-style fintech SaaS portfolio project.</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Product</p>
            <div className="mt-4 space-y-3 text-sm text-muted">
              {marketingNav.map((item) => (
                <div key={item.href}>
                  <Link href={item.href} className="transition hover:text-foreground">
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Trust</p>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <div>
                <Link href="/privacy" className="transition hover:text-foreground">
                  Privacy
                </Link>
              </div>
              <div>
                <Link href="/terms" className="transition hover:text-foreground">
                  Terms
                </Link>
              </div>
              <div>{siteConfig.contactEmail}</div>
            </div>
          </div>
        </div>
      </SiteContainer>
    </footer>
  );
}
