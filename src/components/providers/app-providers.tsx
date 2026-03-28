"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          className: "border border-border bg-surface text-foreground shadow-xl",
        }}
      />
    </ThemeProvider>
  );
}
