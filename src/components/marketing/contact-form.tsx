"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type ContactLeadInput, contactLeadSchema } from "@/lib/validations/contact";

const initialState = {
  name: "",
  email: "",
  company: "",
  interest: "Product demo",
  message: "",
};

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactLeadInput>({
    resolver: zodResolver(contactLeadSchema),
    defaultValues: initialState,
  });

  async function onSubmit(values: ContactLeadInput) {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Unable to submit right now.");
      }

      toast.success("Lead captured in the demo pipeline.");
      reset(initialState);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="motion-rise-in">
        <CardHeader>
          <CardTitle>Send a qualified inquiry</CardTitle>
          <p className="text-sm leading-7 text-muted">
            This form now uses shared primitives, `react-hook-form`, and the same Zod schema as the API route.
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <FormField label="Name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" placeholder="Harsh Kushwaha" {...register("name")} />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" placeholder="harsh@example.com" {...register("email")} />
          </FormField>
          <FormField label="Company" htmlFor="company" error={errors.company?.message}>
            <Input id="company" placeholder="Freelance studio or startup" {...register("company")} />
          </FormField>
          <FormField label="Interest" htmlFor="interest" required error={errors.interest?.message}>
            <Select id="interest" {...register("interest")}>
              <option>Product demo</option>
              <option>Accountant consultation</option>
              <option>Freelancer setup</option>
              <option>Bookkeeping support</option>
            </Select>
          </FormField>
          <FormField
            label="Message"
            htmlFor="message"
            required
            error={errors.message?.message}
            className="sm:col-span-2"
          >
            <Textarea
              id="message"
              placeholder="Tell us what finance workflow you want help with."
              {...register("message")}
            />
          </FormField>
        </CardContent>
        <CardFooter className="flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm leading-7 text-muted">
            This currently posts into a validated demo API route and is ready to connect to the database layer next.
          </p>
          <Button size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Submit inquiry"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
