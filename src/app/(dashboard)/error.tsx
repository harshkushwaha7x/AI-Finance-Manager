"use client";

import { ShellErrorState } from "@/components/shared/shell-state";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ShellErrorState
      title="The dashboard hit a temporary issue"
      description="Try the route again. If the issue continues, inspect the latest auth, layout, or data-layer changes."
      onRetry={reset}
    />
  );
}
