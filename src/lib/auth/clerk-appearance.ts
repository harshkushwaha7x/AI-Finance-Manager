export const clerkAppearance = {
  variables: {
    colorPrimary: "#0f766e",
    colorText: "#111827",
    colorTextSecondary: "#667085",
    colorBackground: "#ffffff",
    colorInputBackground: "#f7f5ef",
    colorInputText: "#111827",
    borderRadius: "1rem",
    fontFamily: "var(--font-plus-jakarta-sans)",
  },
  elements: {
    card: "rounded-[1.75rem] border border-black/6 bg-surface shadow-none",
    headerTitle: "font-display text-2xl font-bold text-foreground",
    headerSubtitle: "text-sm text-muted",
    socialButtonsBlockButton:
      "rounded-2xl border border-border bg-background text-foreground shadow-none hover:bg-surface-subtle",
    formButtonPrimary:
      "rounded-2xl bg-foreground text-white shadow-none hover:bg-black/90",
    footerActionLink: "text-primary hover:text-primary-strong",
    formFieldInput:
      "rounded-2xl border border-border bg-background text-foreground shadow-none",
    identityPreviewText: "text-foreground",
    formFieldLabel: "text-foreground",
  },
};
