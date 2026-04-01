"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

export function DemoResetButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleReset() {
    try {
      const response = await fetch("/api/onboarding", { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Unable to reset onboarding state right now.");
      }

      toast.success("Demo onboarding reset. You can reconfigure the workspace now.");

      startTransition(() => {
        router.replace("/onboarding");
        router.refresh();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)} disabled={isPending}>
        <RotateCcw className="h-4 w-4" />
        {isPending ? "Resetting..." : "Reset demo data"}
      </Button>
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Reset onboarding demo data?"
        description="This clears the current onboarding snapshot so you can replay the portfolio demo from the beginning."
        confirmLabel="Reset onboarding"
        tone="danger"
        onConfirm={handleReset}
      />
    </>
  );
}
