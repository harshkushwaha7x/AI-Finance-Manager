import type { ReactNode } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
