import "server-only";

import { GoalPriority, GoalStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { z } from "zod";

import { buildGoalSummary, sortGoalsForWorkspace } from "@/features/goals/goal-utils";
import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getOnboardingState } from "@/lib/onboarding/server";
import {
  goalContributionInputSchema,
  goalInputSchema,
  goalRecordSchema,
} from "@/lib/validations/finance";
import type {
  GoalContributionInput,
  GoalInput,
  GoalRecord,
  GoalSummary,
  GoalWorkspaceState,
} from "@/types/finance";

export const goalCookieName = "afm-goals";

const goalCookieEntrySchema = goalInputSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

type GoalCookieEntry = z.infer<typeof goalCookieEntrySchema>;

type GoalMutationResult = {
  source: GoalWorkspaceState["source"];
  goal: GoalRecord;
  goals: GoalRecord[];
  summary: GoalSummary;
  persistedGoals: GoalCookieEntry[];
};

type DemoGoalSeed = {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  priority: GoalInput["priority"];
  status: GoalInput["status"];
  icon?: string;
};

const demoGoalSeedMap = {
  personal: [
    {
      id: "b0afc78a-0451-4260-a41e-41f0c2409a01",
      title: "Emergency fund",
      description: "Build a six-month personal safety buffer before increasing discretionary spend.",
      targetAmount: 300000,
      currentAmount: 182000,
      targetDate: "2026-09-30",
      priority: "high",
      status: "active",
      icon: "shield",
    },
    {
      id: "b0afc78a-0451-4260-a41e-41f0c2409a02",
      title: "Vacation reserve",
      description: "Set aside travel money without forcing the monthly cashflow into stress.",
      targetAmount: 90000,
      currentAmount: 36000,
      targetDate: "2026-11-15",
      priority: "medium",
      status: "active",
      icon: "plane",
    },
    {
      id: "b0afc78a-0451-4260-a41e-41f0c2409a03",
      title: "Device upgrade",
      description: "Replace the primary laptop before year-end with cash instead of EMI.",
      targetAmount: 140000,
      currentAmount: 140000,
      targetDate: "2026-06-01",
      priority: "low",
      status: "completed",
      icon: "laptop",
    },
  ],
  freelancer: [
    {
      id: "c1bfd89b-1562-4371-b52f-52a1d351ab01",
      title: "Quarterly tax reserve",
      description: "Keep a predictable reserve ready for GST and advance tax obligations.",
      targetAmount: 180000,
      currentAmount: 98000,
      targetDate: "2026-06-15",
      priority: "high",
      status: "active",
      icon: "receipt",
    },
    {
      id: "c1bfd89b-1562-4371-b52f-52a1d351ab02",
      title: "Studio runway buffer",
      description: "Protect at least two months of freelance operating costs in cash.",
      targetAmount: 250000,
      currentAmount: 126000,
      targetDate: "2026-08-31",
      priority: "high",
      status: "active",
      icon: "briefcase",
    },
    {
      id: "c1bfd89b-1562-4371-b52f-52a1d351ab03",
      title: "Conference travel fund",
      description: "Save for one industry event without touching tax or runway buckets.",
      targetAmount: 75000,
      currentAmount: 18000,
      targetDate: "2026-10-20",
      priority: "medium",
      status: "paused",
      icon: "plane",
    },
  ],
  business: [
    {
      id: "d2cfe90c-2673-4482-c63a-63b2e462bc01",
      title: "Payroll buffer",
      description: "Maintain a cash reserve equal to one month of payroll and core ops.",
      targetAmount: 650000,
      currentAmount: 390000,
      targetDate: "2026-07-31",
      priority: "high",
      status: "active",
      icon: "wallet",
    },
    {
      id: "d2cfe90c-2673-4482-c63a-63b2e462bc02",
      title: "Compliance reserve",
      description: "Hold a compliance-first buffer for tax, filings, and audits.",
      targetAmount: 420000,
      currentAmount: 288000,
      targetDate: "2026-06-30",
      priority: "high",
      status: "active",
      icon: "shield",
    },
    {
      id: "d2cfe90c-2673-4482-c63a-63b2e462bc03",
      title: "Expansion design sprint",
      description: "Fund the next brand and product sprint from cash already reserved.",
      targetAmount: 180000,
      currentAmount: 180000,
      targetDate: "2026-05-15",
      priority: "medium",
      status: "completed",
      icon: "sparkles",
    },
  ],
} satisfies Record<"personal" | "freelancer" | "business", DemoGoalSeed[]>;

function formatLocalDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayStart() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);

  return value;
}

function calculateDaysRemaining(targetDate?: string) {
  if (!targetDate) {
    return null;
  }

  const target = new Date(`${targetDate}T00:00:00`);
  const today = getTodayStart();
  const diff = target.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getMilestoneLabel(progressPercent: number, status: GoalInput["status"]) {
  if (status === "completed" || progressPercent >= 100) {
    return "100% milestone";
  }

  if (progressPercent >= 75) {
    return "75% milestone";
  }

  if (progressPercent >= 50) {
    return "50% milestone";
  }

  if (progressPercent >= 25) {
    return "25% milestone";
  }

  return "First deposit";
}

function hydrateGoalRecord(entry: GoalCookieEntry) {
  const progressPercent =
    entry.targetAmount > 0 ? Math.min(100, (entry.currentAmount / entry.targetAmount) * 100) : 0;
  const normalizedStatus =
    entry.currentAmount >= entry.targetAmount ? "completed" : entry.status;

  return goalRecordSchema.parse({
    ...entry,
    status: normalizedStatus,
    progressPercent,
    remainingAmount: Math.max(entry.targetAmount - entry.currentAmount, 0),
    daysRemaining: calculateDaysRemaining(entry.targetDate),
    milestoneLabel: getMilestoneLabel(progressPercent, normalizedStatus),
  });
}

function serializeGoalsCookie(goals: GoalCookieEntry[]) {
  return JSON.stringify(goalCookieEntrySchema.array().parse(goals));
}

function mapGoalPriority(priority: GoalPriority): GoalInput["priority"] {
  if (priority === GoalPriority.HIGH) {
    return "high";
  }

  if (priority === GoalPriority.LOW) {
    return "low";
  }

  return "medium";
}

function mapGoalStatus(status: GoalStatus): GoalInput["status"] {
  if (status === GoalStatus.COMPLETED) {
    return "completed";
  }

  if (status === GoalStatus.PAUSED) {
    return "paused";
  }

  return "active";
}

function mapGoalPriorityToPrisma(priority: GoalInput["priority"]) {
  if (priority === "high") {
    return GoalPriority.HIGH;
  }

  if (priority === "low") {
    return GoalPriority.LOW;
  }

  return GoalPriority.MEDIUM;
}

function mapGoalStatusToPrisma(status: GoalInput["status"]) {
  if (status === "completed") {
    return GoalStatus.COMPLETED;
  }

  if (status === "paused") {
    return GoalStatus.PAUSED;
  }

  return GoalStatus.ACTIVE;
}

function normalizeOptionalText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function buildWorkspaceState(goals: GoalRecord[], source: GoalWorkspaceState["source"]): GoalWorkspaceState {
  const sortedGoals = sortGoalsForWorkspace(goals);

  return {
    goals: sortedGoals,
    summary: buildGoalSummary(sortedGoals),
    source,
  };
}

function buildDemoGoalEntries(profileType: "personal" | "freelancer" | "business") {
  const now = new Date().toISOString();

  return demoGoalSeedMap[profileType].map((seed) =>
    goalCookieEntrySchema.parse({
      ...seed,
      createdAt: now,
      updatedAt: now,
    }),
  );
}

async function readDemoGoalEntries(profileType: "personal" | "freelancer" | "business") {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(goalCookieName)?.value;

  if (!rawValue) {
    return buildDemoGoalEntries(profileType);
  }

  try {
    return goalCookieEntrySchema.array().parse(JSON.parse(rawValue));
  } catch {
    return buildDemoGoalEntries(profileType);
  }
}

async function getDatabaseContext(viewer: ViewerContext) {
  if (!appEnv.hasDatabase || !viewer.isSignedIn || !viewer.email) {
    return null;
  }

  try {
    const prisma = getPrismaClient();

    if (!prisma) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: viewer.email },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    return {
      prisma,
      userId: user.id,
    };
  } catch {
    return null;
  }
}

async function readDatabaseGoalState(viewer: ViewerContext) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const goals = await context.prisma.goal.findMany({
    where: { userId: context.userId },
    orderBy: [{ status: "asc" }, { targetDate: "asc" }, { createdAt: "desc" }],
  });

  return {
    source: "database" as const,
    goals: goals.map((goal) =>
      hydrateGoalRecord(
        goalCookieEntrySchema.parse({
          id: goal.id,
          title: goal.title,
          description: normalizeOptionalText(goal.description) ?? "",
          targetAmount: Number(goal.targetAmount),
          currentAmount: Number(goal.currentAmount),
          targetDate: goal.targetDate ? formatLocalDate(goal.targetDate) : undefined,
          priority: mapGoalPriority(goal.priority),
          status: mapGoalStatus(goal.status),
          icon: normalizeOptionalText(goal.icon) ?? "",
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString(),
        }),
      ),
    ),
  };
}

async function getGoalBaseState(viewer: ViewerContext): Promise<GoalWorkspaceState> {
  const onboardingState = await getOnboardingState(viewer);
  const databaseState = await readDatabaseGoalState(viewer);

  if (databaseState) {
    return buildWorkspaceState(databaseState.goals, "database");
  }

  const demoGoals = await readDemoGoalEntries(onboardingState.profileType);

  return buildWorkspaceState(demoGoals.map(hydrateGoalRecord), "demo");
}

async function createDatabaseGoal(
  input: GoalInput,
  viewer: ViewerContext,
): Promise<GoalMutationResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const created = await context.prisma.goal.create({
    data: {
      userId: context.userId,
      title: input.title,
      description: normalizeOptionalText(input.description),
      targetAmount: input.targetAmount,
      currentAmount: input.currentAmount,
      targetDate: input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : undefined,
      priority: mapGoalPriorityToPrisma(input.priority),
      status: mapGoalStatusToPrisma(
        input.currentAmount >= input.targetAmount ? "completed" : input.status,
      ),
      icon: normalizeOptionalText(input.icon),
    },
  });

  const state = await getGoalBaseState(viewer);
  const goal = state.goals.find((item) => item.id === created.id);

  if (!goal) {
    return null;
  }

  return {
    source: "database",
    goal,
    goals: state.goals,
    summary: state.summary,
    persistedGoals: [],
  };
}

async function updateDatabaseGoal(
  goalId: string,
  input: GoalInput,
  viewer: ViewerContext,
): Promise<GoalMutationResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const existing = await context.prisma.goal.findFirst({
    where: {
      id: goalId,
      userId: context.userId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  await context.prisma.goal.update({
    where: { id: goalId },
    data: {
      title: input.title,
      description: normalizeOptionalText(input.description),
      targetAmount: input.targetAmount,
      currentAmount: input.currentAmount,
      targetDate: input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : null,
      priority: mapGoalPriorityToPrisma(input.priority),
      status: mapGoalStatusToPrisma(
        input.currentAmount >= input.targetAmount ? "completed" : input.status,
      ),
      icon: normalizeOptionalText(input.icon),
    },
  });

  const state = await getGoalBaseState(viewer);
  const goal = state.goals.find((item) => item.id === goalId);

  if (!goal) {
    return null;
  }

  return {
    source: "database",
    goal,
    goals: state.goals,
    summary: state.summary,
    persistedGoals: [],
  };
}

async function contributeDatabaseGoal(
  goalId: string,
  input: GoalContributionInput,
  viewer: ViewerContext,
): Promise<GoalMutationResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const existing = await context.prisma.goal.findFirst({
    where: {
      id: goalId,
      userId: context.userId,
    },
  });

  if (!existing) {
    return null;
  }

  const nextCurrentAmount = Number(existing.currentAmount) + input.amount;
  const nextStatus = nextCurrentAmount >= Number(existing.targetAmount) ? "completed" : mapGoalStatus(existing.status);

  await context.prisma.goal.update({
    where: { id: goalId },
    data: {
      currentAmount: nextCurrentAmount,
      status: mapGoalStatusToPrisma(nextStatus),
    },
  });

  const state = await getGoalBaseState(viewer);
  const goal = state.goals.find((item) => item.id === goalId);

  if (!goal) {
    return null;
  }

  return {
    source: "database",
    goal,
    goals: state.goals,
    summary: state.summary,
    persistedGoals: [],
  };
}

async function deleteDatabaseGoal(goalId: string, viewer: ViewerContext) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const existing = await context.prisma.goal.findFirst({
    where: {
      id: goalId,
      userId: context.userId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  await context.prisma.goal.delete({
    where: { id: goalId },
  });

  return getGoalBaseState(viewer);
}

export function getGoalCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export async function getGoalWorkspaceState(viewer: ViewerContext): Promise<GoalWorkspaceState> {
  return getGoalBaseState(viewer);
}

export async function createGoal(
  viewer: ViewerContext,
  input: GoalInput,
): Promise<GoalMutationResult> {
  const parsedInput = goalInputSchema.parse(input);
  const databaseResult = await createDatabaseGoal(parsedInput, viewer);

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const persistedGoals = await readDemoGoalEntries(onboardingState.profileType);
  const now = new Date().toISOString();
  const nextGoal = goalCookieEntrySchema.parse({
    ...parsedInput,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  });
  const nextPersistedGoals = [nextGoal, ...persistedGoals];
  const goals = nextPersistedGoals.map(hydrateGoalRecord);
  const goal = goals.find((item) => item.id === nextGoal.id) ?? goals[0];

  return {
    source: "demo",
    goal,
    goals: sortGoalsForWorkspace(goals),
    summary: buildGoalSummary(goals),
    persistedGoals: nextPersistedGoals,
  };
}

export async function updateGoal(
  viewer: ViewerContext,
  goalId: string,
  input: GoalInput,
): Promise<GoalMutationResult | null> {
  const parsedInput = goalInputSchema.parse(input);
  const databaseResult = await updateDatabaseGoal(goalId, parsedInput, viewer);

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const persistedGoals = await readDemoGoalEntries(onboardingState.profileType);
  const existingGoal = persistedGoals.find((goal) => goal.id === goalId);

  if (!existingGoal) {
    return null;
  }

  const nextPersistedGoals = persistedGoals.map((goal) =>
    goal.id === goalId
      ? goalCookieEntrySchema.parse({
          ...goal,
          ...parsedInput,
          status:
            parsedInput.currentAmount >= parsedInput.targetAmount
              ? "completed"
              : parsedInput.status,
          updatedAt: new Date().toISOString(),
        })
      : goal,
  );
  const goals = nextPersistedGoals.map(hydrateGoalRecord);
  const goal = goals.find((item) => item.id === goalId);

  if (!goal) {
    return null;
  }

  return {
    source: "demo",
    goal,
    goals: sortGoalsForWorkspace(goals),
    summary: buildGoalSummary(goals),
    persistedGoals: nextPersistedGoals,
  };
}

export async function contributeToGoal(
  viewer: ViewerContext,
  goalId: string,
  input: GoalContributionInput,
): Promise<GoalMutationResult | null> {
  const parsedInput = goalContributionInputSchema.parse(input);
  const databaseResult = await contributeDatabaseGoal(goalId, parsedInput, viewer);

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const persistedGoals = await readDemoGoalEntries(onboardingState.profileType);
  const existingGoal = persistedGoals.find((goal) => goal.id === goalId);

  if (!existingGoal) {
    return null;
  }

  const nextPersistedGoals = persistedGoals.map((goal) => {
    if (goal.id !== goalId) {
      return goal;
    }

    const nextCurrentAmount = goal.currentAmount + parsedInput.amount;
    const nextStatus = nextCurrentAmount >= goal.targetAmount ? "completed" : goal.status;

    return goalCookieEntrySchema.parse({
      ...goal,
      currentAmount: nextCurrentAmount,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  });
  const goals = nextPersistedGoals.map(hydrateGoalRecord);
  const goal = goals.find((item) => item.id === goalId);

  if (!goal) {
    return null;
  }

  return {
    source: "demo",
    goal,
    goals: sortGoalsForWorkspace(goals),
    summary: buildGoalSummary(goals),
    persistedGoals: nextPersistedGoals,
  };
}

export async function deleteGoal(viewer: ViewerContext, goalId: string) {
  const databaseResult = await deleteDatabaseGoal(goalId, viewer);

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const persistedGoals = await readDemoGoalEntries(onboardingState.profileType);
  const nextPersistedGoals = persistedGoals.filter((goal) => goal.id !== goalId);

  if (nextPersistedGoals.length === persistedGoals.length) {
    return null;
  }

  const goals = nextPersistedGoals.map(hydrateGoalRecord);

  return {
    source: "demo" as const,
    goals: sortGoalsForWorkspace(goals),
    summary: buildGoalSummary(goals),
    persistedGoals: nextPersistedGoals,
  };
}

export function getSerializedGoalsCookie(goals: GoalCookieEntry[]) {
  return serializeGoalsCookie(goals);
}
