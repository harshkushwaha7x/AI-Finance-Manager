"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const initialState = {
  name: "",
  email: "",
  company: "",
  interest: "Product demo",
  message: "",
};

export function ContactForm() {
  const [formState, setFormState] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        throw new Error("Unable to submit right now.");
      }

      toast.success("Lead captured in the demo pipeline.");
      setFormState(initialState);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.8rem] border border-black/6 bg-surface p-6 shadow-[0_20px_80px_-60px_rgba(17,24,39,0.55)]"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-foreground">
          <span>Name</span>
          <input
            required
            value={formState.name}
            onChange={(event) => setFormState((state) => ({ ...state, name: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
            placeholder="Harsh Kushwaha"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-foreground">
          <span>Email</span>
          <input
            required
            type="email"
            value={formState.email}
            onChange={(event) => setFormState((state) => ({ ...state, email: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
            placeholder="harsh@example.com"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-foreground">
          <span>Company</span>
          <input
            value={formState.company}
            onChange={(event) => setFormState((state) => ({ ...state, company: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
            placeholder="Freelance studio or startup"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-foreground">
          <span>Interest</span>
          <select
            value={formState.interest}
            onChange={(event) => setFormState((state) => ({ ...state, interest: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
          >
            <option>Product demo</option>
            <option>Accountant consultation</option>
            <option>Freelancer setup</option>
            <option>Bookkeeping support</option>
          </select>
        </label>
      </div>
      <label className="mt-5 block space-y-2 text-sm font-medium text-foreground">
        <span>Message</span>
        <textarea
          required
          value={formState.message}
          onChange={(event) => setFormState((state) => ({ ...state, message: event.target.value }))}
          className="min-h-36 w-full rounded-3xl border border-border bg-background px-4 py-4 outline-none transition focus:border-primary"
          placeholder="Tell us what finance workflow you want help with."
        />
      </label>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-muted">
          This currently posts into a validated demo API route and is ready to connect to the database layer next.
        </p>
        <Button size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Submit inquiry"}
        </Button>
      </div>
    </form>
  );
}
