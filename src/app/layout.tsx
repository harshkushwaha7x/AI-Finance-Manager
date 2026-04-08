import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { AppProviders } from "@/components/providers/app-providers";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";
import { appEnv } from "@/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-finance-manager.vercel.app"),
  title: {
    default: "AI Finance Manager",
    template: "%s | AI Finance Manager",
  },
  description:
    "A premium India-first finance platform for tracking money, automating accounting workflows, and delivering AI-powered insights.",
  keywords: [
    "AI finance manager",
    "fintech dashboard",
    "accountant service",
    "GST invoicing",
    "expense tracking",
    "Next.js SaaS",
  ],
  openGraph: {
    title: "AI Finance Manager",
    description:
      "Track cash flow, analyze spending with AI, manage GST-ready invoices, and request accountant services in one premium SaaS experience.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const content = <AppProviders>{children}</AppProviders>;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full scroll-smooth antialiased"
    >
      <body className="min-h-full bg-background text-foreground">
        {appEnv.hasClerk ? (
          <ClerkProvider appearance={clerkAppearance}>{content}</ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
