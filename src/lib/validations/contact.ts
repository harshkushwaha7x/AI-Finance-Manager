import { z } from "zod";

export const contactLeadSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.email("Valid email is required."),
  company: z.string().optional().or(z.literal("")),
  interest: z.string().min(2, "Please choose an interest."),
  message: z.string().min(12, "Please add more detail to the message."),
});

export type ContactLeadInput = z.infer<typeof contactLeadSchema>;
