import "server-only";

import { BillingStatus, CategoryKind, ProfileType, SubscriptionPlan } from "@prisma/client";
import { cookies } from "next/headers";

import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { defaultCategoryTemplates } from "@/lib/db/seed-data";
import { appEnv } from "@/lib/env";
import { onboardingCookieName, onboardingDefaultValues } from "@/lib/onboarding/constants";
import {
  onboardingCookiePayloadSchema,
  type OnboardingCookiePayload,
  type OnboardingInput,
} from "@/lib/validations/onboarding";

export type OnboardingState = {
  completed: boolean;
  source: "cookie" | "database" | "demo";
  profileType: OnboardingCookiePayload["profileType"];
  fullName: string;
  workspaceName: string;
  currency: string;
  fiscalYearStartMonth: number;
  monthlyIncomeTarget: number;
  monthlyBudgetTarget: number;
  focusAreas: OnboardingCookiePayload["focusAreas"];
};

function getDefaultState(): OnboardingState {
  return {
    completed: false,
    source: "demo",
    profileType: onboardingDefaultValues.profileType,
    fullName: "",
    workspaceName: "",
    currency: onboardingDefaultValues.currency,
    fiscalYearStartMonth: onboardingDefaultValues.fiscalYearStartMonth,
    monthlyIncomeTarget: onboardingDefaultValues.monthlyIncomeTarget,
    monthlyBudgetTarget: onboardingDefaultValues.monthlyBudgetTarget,
    focusAreas: [...onboardingDefaultValues.focusAreas],
  };
}

function mapProfileTypeToPrisma(profileType: OnboardingInput["profileType"]) {
  if (profileType === "personal") {
    return ProfileType.PERSONAL;
  }

  if (profileType === "business") {
    return ProfileType.BUSINESS;
  }

  return ProfileType.FREELANCER;
}

function mapPrismaProfileType(profileType: ProfileType): OnboardingState["profileType"] {
  if (profileType === ProfileType.PERSONAL) {
    return "personal";
  }

  if (profileType === ProfileType.BUSINESS) {
    return "business";
  }

  return "freelancer";
}

function mapTemplateKind(kind: "income" | "expense") {
  return kind === "income" ? CategoryKind.INCOME : CategoryKind.EXPENSE;
}

async function readCookieState() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(onboardingCookieName)?.value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = onboardingCookiePayloadSchema.parse(JSON.parse(rawValue));

    return {
      completed: true,
      source: "cookie" as const,
      ...parsed,
    };
  } catch {
    return null;
  }
}

async function readDatabaseState(viewer: ViewerContext) {
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
      include: {
        businessProfiles: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!user?.onboardingCompleted) {
      return null;
    }

    const businessProfile = user.businessProfiles[0];

    return {
      completed: true,
      source: "database" as const,
      profileType: businessProfile ? mapPrismaProfileType(businessProfile.profileType) : "freelancer",
      fullName: user.fullName ?? viewer.name ?? "",
      workspaceName:
        businessProfile?.tradeName ??
        businessProfile?.legalName ??
        user.fullName ??
        viewer.name ??
        "",
      currency: user.defaultCurrency,
      fiscalYearStartMonth: businessProfile?.fiscalYearStartMonth ?? 4,
      monthlyIncomeTarget: 0,
      monthlyBudgetTarget: 0,
      focusAreas: [...onboardingDefaultValues.focusAreas],
    };
  } catch {
    return null;
  }
}

export async function getOnboardingState(viewer?: ViewerContext): Promise<OnboardingState> {
  if (viewer) {
    const databaseState = await readDatabaseState(viewer);

    if (databaseState) {
      return databaseState;
    }
  }

  const cookieState = await readCookieState();

  if (cookieState) {
    return cookieState;
  }

  return getDefaultState();
}

export function createOnboardingCookiePayload(input: OnboardingInput): OnboardingCookiePayload {
  return onboardingCookiePayloadSchema.parse({
    profileType: input.profileType,
    fullName: input.fullName,
    workspaceName: input.workspaceName,
    currency: input.currency,
    fiscalYearStartMonth: input.fiscalYearStartMonth,
    monthlyIncomeTarget: input.monthlyIncomeTarget,
    monthlyBudgetTarget: input.monthlyBudgetTarget,
    focusAreas: input.focusAreas,
  });
}

export async function persistOnboardingToDatabase(input: OnboardingInput, viewer: ViewerContext) {
  if (!appEnv.hasDatabase || !viewer.isSignedIn || !viewer.email) {
    return { persisted: false as const };
  }

  try {
    const prisma = getPrismaClient();

    if (!prisma) {
      return { persisted: false as const };
    }

    const user = await prisma.user.upsert({
      where: { email: viewer.email },
      update: {
        clerkUserId: viewer.clerkUserId ?? undefined,
        fullName: input.fullName,
        onboardingCompleted: true,
        defaultCurrency: input.currency,
      },
      create: {
        clerkUserId: viewer.clerkUserId ?? undefined,
        email: viewer.email,
        fullName: input.fullName,
        onboardingCompleted: true,
        defaultCurrency: input.currency,
      },
    });

    const existingProfile = await prisma.businessProfile.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    if (existingProfile) {
      await prisma.businessProfile.update({
        where: { id: existingProfile.id },
        data: {
          profileType: mapProfileTypeToPrisma(input.profileType),
          legalName: input.legalName || undefined,
          tradeName: input.workspaceName,
          gstin: input.gstin || undefined,
          fiscalYearStartMonth: input.fiscalYearStartMonth,
        },
      });
    } else {
      await prisma.businessProfile.create({
        data: {
          userId: user.id,
          profileType: mapProfileTypeToPrisma(input.profileType),
          legalName: input.legalName || undefined,
          tradeName: input.workspaceName,
          gstin: input.gstin || undefined,
          fiscalYearStartMonth: input.fiscalYearStartMonth,
        },
      });
    }

    const existingCategories = await prisma.category.findMany({
      where: { userId: user.id },
      select: { slug: true, kind: true },
    });

    const missingCategoryTemplates = defaultCategoryTemplates.filter((template) => {
      return !existingCategories.some(
        (category) =>
          category.slug === template.slug && category.kind === mapTemplateKind(template.kind),
      );
    });

    if (missingCategoryTemplates.length) {
      await prisma.category.createMany({
        data: missingCategoryTemplates.map((template) => ({
          userId: user.id,
          name: template.name,
          slug: template.slug,
          kind: mapTemplateKind(template.kind),
          icon: template.icon,
          color: template.color,
          isDefault: true,
        })),
      });
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!existingSubscription) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: SubscriptionPlan.FREE,
          billingStatus: BillingStatus.MANUAL,
        },
      });
    }

    return { persisted: true as const, userId: user.id };
  } catch {
    return { persisted: false as const };
  }
}
