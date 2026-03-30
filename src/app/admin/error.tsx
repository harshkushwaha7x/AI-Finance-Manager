"use client";

import { ShellErrorState } from "@/components/shared/shell-state";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ShellErrorState
      title="The admin console hit a temporary issue"
      description="Reload the page after checking your auth configuration and the latest admin route changes."
      onRetry={reset}
    />
  );
}
