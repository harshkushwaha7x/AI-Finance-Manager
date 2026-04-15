import "server-only";

import { cookies } from "next/headers";

import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { contactLeadRecordSchema } from "@/lib/validations/admin";
import { contactLeadSchema } from "@/lib/validations/contact";
import type { ContactLeadInput } from "@/lib/validations/contact";
import type { ContactLeadRecord } from "@/types/admin";

export const contactLeadCookieName = "afm-contact-leads";

type ContactLeadMutationResult = {
  source: "demo" | "database";
  lead: ContactLeadRecord;
  leads: ContactLeadRecord[];
  persistedLeads: ContactLeadRecord[];
};

const demoContactLeadSeeds = [
  {
    id: "5d28e401-1fa0-4ab6-a11e-90a81e100001",
    name: "Aanya Kapoor",
    email: "aanya@example.com",
    company: "Northline Studio",
    interest: "Product demo",
    message: "We want to evaluate the dashboard and accountant workflow for a lean freelancer team.",
    source: "marketing-demo",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5d28e401-1fa0-4ab6-a11e-90a81e100002",
    name: "Rohan Mehta",
    email: "rohan@example.com",
    company: "Vertex Retail",
    interest: "Bookkeeping support",
    message: "Need recurring bookkeeping support and want to understand how the service lane works with GST documents.",
    source: "marketing-demo",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5d28e401-1fa0-4ab6-a11e-90a81e100003",
    name: "Neha Singh",
    email: "neha@example.com",
    company: "",
    interest: "Accountant consultation",
    message: "I want a one-time review of personal cash flow and savings strategy before I commit to a larger plan.",
    source: "marketing-demo",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function sortLeads(leads: ContactLeadRecord[]) {
  return [...leads].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function serializeLeadsCookie(leads: ContactLeadRecord[]) {
  return JSON.stringify(sortLeads(leads).map((lead) => contactLeadRecordSchema.parse(lead)));
}

async function readDemoLeadRecords() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(contactLeadCookieName)?.value;

  if (!rawValue) {
    return demoContactLeadSeeds.map((lead) => contactLeadRecordSchema.parse(lead));
  }

  try {
    const parsed = JSON.parse(rawValue);

    return sortLeads(
      (Array.isArray(parsed) ? parsed : []).map((lead) => contactLeadRecordSchema.parse(lead)),
    );
  } catch {
    return demoContactLeadSeeds.map((lead) => contactLeadRecordSchema.parse(lead));
  }
}

async function readDatabaseLeadRecords() {
  if (!appEnv.hasDatabase) {
    return null;
  }

  try {
    const prisma = getPrismaClient();

    if (!prisma) {
      return null;
    }

    const leads = await prisma.contactLead.findMany({
      orderBy: [{ createdAt: "desc" }],
    });

    return leads.map((lead) =>
      contactLeadRecordSchema.parse({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        company: lead.company ?? "",
        interest: lead.interest,
        message: lead.message,
        source: lead.source,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      }),
    );
  } catch {
    return null;
  }
}

export function getContactLeadCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export async function getContactLeadRecords() {
  const databaseLeads = await readDatabaseLeadRecords();

  if (databaseLeads) {
    return {
      leads: databaseLeads,
      source: "database" as const,
    };
  }

  return {
    leads: await readDemoLeadRecords(),
    source: "demo" as const,
  };
}

export async function createContactLead(
  input: ContactLeadInput,
  source = "marketing-contact",
): Promise<ContactLeadMutationResult> {
  const parsedInput = contactLeadSchema.parse(input);

  if (appEnv.hasDatabase) {
    try {
      const prisma = getPrismaClient();

      if (prisma) {
        const created = await prisma.contactLead.create({
          data: {
            ...parsedInput,
            company: parsedInput.company || undefined,
            source,
          },
        });
        const nextState = await getContactLeadRecords();
        const lead = nextState.leads.find((item) => item.id === created.id);

        if (lead) {
          return {
            source: "database",
            lead,
            leads: nextState.leads,
            persistedLeads: [],
          };
        }
      }
    } catch {
      // Fall back to demo persistence below.
    }
  }

  const existingLeads = await readDemoLeadRecords();
  const now = new Date().toISOString();
  const nextLead = contactLeadRecordSchema.parse({
    ...parsedInput,
    id: crypto.randomUUID(),
    source,
    createdAt: now,
    updatedAt: now,
  });
  const nextLeads = sortLeads([nextLead, ...existingLeads]);

  return {
    source: "demo",
    lead: nextLead,
    leads: nextLeads,
    persistedLeads: nextLeads,
  };
}

export function getSerializedContactLeadsCookie(leads: ContactLeadRecord[]) {
  return serializeLeadsCookie(leads);
}
