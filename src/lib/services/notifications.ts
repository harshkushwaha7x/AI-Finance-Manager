import "server-only";

import { createHash } from "node:crypto";

import { NotificationType as PrismaNotificationType } from "@prisma/client";
import { cookies } from "next/headers";
import { z } from "zod";

import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getAccountantWorkspaceState } from "@/lib/services/accountant";
import { getBookingWorkspaceState } from "@/lib/services/appointments";
import { getBudgetWorkspaceState } from "@/lib/services/budgets";
import { getGoalWorkspaceState } from "@/lib/services/goals";
import { getInsightWorkspaceState } from "@/lib/services/insights";
import { getReportWorkspaceState } from "@/lib/services/reports";
import { getTransactionWorkspaceState } from "@/lib/services/transactions";
import {
  notificationActivityItemSchema,
  notificationReadInputSchema,
  notificationRecordSchema,
  notificationSummarySchema,
  notificationWorkspaceStateSchema,
} from "@/lib/validations/finance";
import type {
  NotificationActivityItem,
  NotificationReadInput,
  NotificationRecord,
  NotificationSummary,
  NotificationType,
  NotificationWorkspaceState,
} from "@/types/finance";
import { formatTransactionAmount, formatTransactionDate } from "@/features/transactions/transaction-utils";

export const notificationReadCookieName = "afm-notification-read-state";

const notificationReadCookieEntrySchema = z.object({
  id: z.string().uuid(),
  readAt: z.string().min(1),
});

type NotificationReadCookieEntry = z.infer<typeof notificationReadCookieEntrySchema>;
type NotificationMutationResult = NotificationWorkspaceState & {
  persistedReadState: NotificationReadCookieEntry[];
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelativeStateLabel(value: string) {
  return value.replaceAll("_", " ");
}

function buildStableUuid(key: string) {
  const hash = createHash("sha256").update(key).digest("hex");

  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function getNotificationOwnerKey(viewer: ViewerContext) {
  return viewer.email || viewer.clerkUserId || "demo-workspace";
}

function truncateCopy(value: string, max = 180) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1).trim()}…`;
}

function buildSummary(notifications: NotificationRecord[]): NotificationSummary {
  return notificationSummarySchema.parse({
    totalCount: notifications.length,
    unreadCount: notifications.filter((item) => !item.readAt).length,
    budgetCount: notifications.filter((item) => item.type === "budget_alert").length,
    goalCount: notifications.filter((item) => item.type === "goal_update").length,
    reportCount: notifications.filter((item) => item.type === "report_ready").length,
    serviceCount: notifications.filter((item) => item.type === "service_status").length,
    systemCount: notifications.filter((item) => item.type === "system").length,
  });
}

function sortNotifications(notifications: NotificationRecord[]) {
  return [...notifications].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function createNotification(params: {
  ownerKey: string;
  eventKey: string;
  type: NotificationType;
  title: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
  tone: NotificationRecord["tone"];
  createdAt: string;
  updatedAt?: string;
}) {
  return notificationRecordSchema.parse({
    id: buildStableUuid(`${params.ownerKey}:${params.eventKey}`),
    type: params.type,
    title: params.title,
    body: params.body,
    ctaUrl: params.ctaUrl ?? "",
    ctaLabel: params.ctaLabel ?? "",
    tone: params.tone,
    readAt: "",
    createdAt: params.createdAt,
    updatedAt: params.updatedAt ?? params.createdAt,
  });
}

function buildActivityFeed(params: {
  transactions: Awaited<ReturnType<typeof getTransactionWorkspaceState>>;
  insights: Awaited<ReturnType<typeof getInsightWorkspaceState>>;
  reports: Awaited<ReturnType<typeof getReportWorkspaceState>>;
  bookings: Awaited<ReturnType<typeof getBookingWorkspaceState>>;
}) {
  const items: Array<NotificationActivityItem & { sortAt: string }> = [];

  for (const transaction of params.transactions.transactions
    .slice()
    .sort((left, right) => right.transactionDate.localeCompare(left.transactionDate))
    .slice(0, 3)) {
    items.push({
      id: `txn-${transaction.id}`,
      title: transaction.title,
      detail: `${formatTransactionAmount(transaction.amount, transaction.currency)} · ${transaction.categoryLabel}`,
      badge: transaction.type === "income" ? "Ledger in" : transaction.type === "expense" ? "Ledger out" : "Transfer",
      badgeTone: transaction.type === "income" ? "success" : transaction.type === "expense" ? "secondary" : "neutral",
      dateLabel: formatTransactionDate(transaction.transactionDate),
      sortAt: `${transaction.transactionDate}T00:00:00.000Z`,
    });
  }

  if (params.insights.current) {
    items.push({
      id: `insight-${params.insights.current.id}`,
      title: "AI insight snapshot refreshed",
      detail: truncateCopy(params.insights.current.response.summary, 120),
      badge: "AI",
      badgeTone: params.insights.current.source === "openai" ? "primary" : "secondary",
      dateLabel: formatDateTime(params.insights.current.generatedAt),
      sortAt: params.insights.current.generatedAt,
    });
  }

  if (params.reports.current) {
    items.push({
      id: `report-${params.reports.current.id}`,
      title: "Finance report available",
      detail: `${params.reports.current.periodLabel} · ${params.reports.current.format.toUpperCase()} export ready`,
      badge: "Report",
      badgeTone: "success",
      dateLabel: formatDateTime(params.reports.current.generatedAt),
      sortAt: params.reports.current.generatedAt,
    });
  }

  const latestAppointment = params.bookings.appointments
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];

  if (latestAppointment) {
    items.push({
      id: `appt-${latestAppointment.id}`,
      title: latestAppointment.requestLabel,
      detail: latestAppointment.notificationMessage || "Booking state updated.",
      badge: "Service",
      badgeTone: latestAppointment.status === "cancelled" ? "danger" : "warning",
      dateLabel: formatDateTime(latestAppointment.updatedAt),
      sortAt: latestAppointment.updatedAt,
    });
  }

  return items
    .sort((left, right) => right.sortAt.localeCompare(left.sortAt))
    .slice(0, 6)
    .map((item) =>
      notificationActivityItemSchema.parse({
        id: item.id,
        title: item.title,
        detail: item.detail,
        badge: item.badge,
        badgeTone: item.badgeTone,
        dateLabel: item.dateLabel,
      }),
    );
}

function mapNotificationTypeToPrisma(type: NotificationType) {
  if (type === "budget_alert") {
    return PrismaNotificationType.BUDGET_ALERT;
  }

  if (type === "goal_update") {
    return PrismaNotificationType.GOAL_UPDATE;
  }

  if (type === "report_ready") {
    return PrismaNotificationType.REPORT_READY;
  }

  if (type === "service_status") {
    return PrismaNotificationType.SERVICE_STATUS;
  }

  return PrismaNotificationType.SYSTEM;
}

function getNotificationCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

async function readDemoReadState() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(notificationReadCookieName)?.value;

  if (!rawValue) {
    return [] as NotificationReadCookieEntry[];
  }

  try {
    return notificationReadCookieEntrySchema.array().parse(JSON.parse(rawValue));
  } catch {
    return [] as NotificationReadCookieEntry[];
  }
}

function serializeDemoReadState(entries: NotificationReadCookieEntry[]) {
  return JSON.stringify(notificationReadCookieEntrySchema.array().parse(entries));
}

function applyReadState(
  notifications: NotificationRecord[],
  entries: NotificationReadCookieEntry[],
) {
  const readMap = new Map(entries.map((entry) => [entry.id, entry.readAt]));

  return notifications.map((notification) =>
    notificationRecordSchema.parse({
      ...notification,
      readAt: readMap.get(notification.id) ?? "",
    }),
  );
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

async function buildNotificationCandidates(viewer: ViewerContext) {
  const ownerKey = getNotificationOwnerKey(viewer);
  const [
    transactionState,
    budgetState,
    goalState,
    reportState,
    insightState,
    bookingState,
    accountantState,
  ] = await Promise.all([
    getTransactionWorkspaceState(viewer),
    getBudgetWorkspaceState(viewer),
    getGoalWorkspaceState(viewer),
    getReportWorkspaceState(viewer),
    getInsightWorkspaceState(viewer),
    getBookingWorkspaceState(viewer),
    getAccountantWorkspaceState(viewer),
  ]);

  const candidates: NotificationRecord[] = [];

  for (const alert of budgetState.alerts.slice(0, 4)) {
    const budget = budgetState.budgets.find((item) => item.id === alert.budgetId);

    candidates.push(
      createNotification({
        ownerKey,
        eventKey: `budget:${alert.budgetId}:${alert.status}`,
        type: "budget_alert",
        title: alert.title,
        body: alert.description,
        ctaUrl: "/dashboard/budgets",
        ctaLabel: "Open budgets",
        tone: alert.tone,
        createdAt: budget?.updatedAt ?? new Date().toISOString(),
        updatedAt: budget?.updatedAt ?? new Date().toISOString(),
      }),
    );
  }

  for (const goal of goalState.goals
    .filter(
      (item) =>
        (item.status === "active" && item.daysRemaining !== null && item.daysRemaining <= 30) ||
        item.status === "completed",
    )
    .slice(0, 3)) {
    candidates.push(
      createNotification({
        ownerKey,
        eventKey: `goal:${goal.id}:${goal.status}:${goal.updatedAt}`,
        type: "goal_update",
        title:
          goal.status === "completed"
            ? `${goal.title} reached its target`
            : `${goal.title} needs attention soon`,
        body:
          goal.status === "completed"
            ? `This goal is now fully funded and can move out of the active planning queue.`
            : `${formatTransactionAmount(goal.remainingAmount)} remaining with ${
                goal.daysRemaining ?? "no"
              } day${goal.daysRemaining === 1 ? "" : "s"} left.`,
        ctaUrl: "/dashboard/goals",
        ctaLabel: "Open goals",
        tone: goal.status === "completed" ? "success" : goal.priority === "high" ? "warning" : "secondary",
        createdAt: goal.updatedAt,
      }),
    );
  }

  const reportNotifications = [reportState.current, ...reportState.history].filter(
    (report): report is NonNullable<typeof reportState.current> => Boolean(report),
  );

  for (const report of reportNotifications.slice(0, 2)) {
    candidates.push(
      createNotification({
        ownerKey,
        eventKey: `report:${report.id}`,
        type: "report_ready",
        title: `Report ready for ${report.periodLabel}`,
        body: `${report.format.toUpperCase()} export prepared from a ${report.source === "openai" ? "model-enhanced" : "fallback"} finance snapshot.`,
        ctaUrl: "/dashboard/reports",
        ctaLabel: "Open reports",
        tone: "success",
        createdAt: report.generatedAt,
      }),
    );
  }

  const appointmentNotifications = bookingState.appointments
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 3);

  for (const appointment of appointmentNotifications) {
    candidates.push(
      createNotification({
        ownerKey,
        eventKey: `appointment:${appointment.id}:${appointment.status}`,
        type: "service_status",
        title: appointment.requestLabel,
        body: appointment.notificationMessage || `Consultation ${formatRelativeStateLabel(appointment.status)}.`,
        ctaUrl: "/dashboard/bookings",
        ctaLabel: "Open bookings",
        tone:
          appointment.status === "cancelled"
            ? "danger"
            : appointment.status === "completed"
              ? "success"
              : "warning",
        createdAt: appointment.updatedAt,
      }),
    );
  }

  const appointmentRequestIds = new Set(appointmentNotifications.map((item) => item.requestId));

  for (const request of accountantState.requests
    .filter(
      (item) =>
        !appointmentRequestIds.has(item.id) &&
        ["new", "qualified", "in_progress"].includes(item.status),
    )
    .slice(0, 2)) {
    candidates.push(
      createNotification({
        ownerKey,
        eventKey: `request:${request.id}:${request.status}`,
        type: "service_status",
        title: request.packageLabel || "Accountant request updated",
        body: `Request is currently ${formatRelativeStateLabel(request.status)} and ${request.urgency} urgency.`,
        ctaUrl: "/dashboard/accountant",
        ctaLabel: "Open accountant",
        tone:
          request.status === "in_progress"
            ? "primary"
            : request.urgency === "high"
              ? "danger"
              : "secondary",
        createdAt: request.updatedAt,
      }),
    );
  }

  if (insightState.current) {
    candidates.push(
      createNotification({
        ownerKey,
        eventKey: `insight:${insightState.current.id}`,
        type: "system",
        title: "AI insights snapshot ready",
        body: truncateCopy(insightState.current.response.summary, 150),
        ctaUrl: "/dashboard/insights",
        ctaLabel: "Open insights",
        tone: insightState.current.source === "openai" ? "primary" : "secondary",
        createdAt: insightState.current.generatedAt,
      }),
    );
  }

  if (transactionState.summary.reviewCount > 0 || transactionState.summary.categorizationQueueCount > 0) {
    candidates.push(
      createNotification({
        ownerKey,
        eventKey: `ledger-review:${transactionState.summary.reviewCount}:${transactionState.summary.categorizationQueueCount}`,
        type: "system",
        title: "Ledger review queue needs attention",
        body: `${transactionState.summary.reviewCount} pending transaction${
          transactionState.summary.reviewCount === 1 ? "" : "s"
        } and ${transactionState.summary.categorizationQueueCount} categorization item${
          transactionState.summary.categorizationQueueCount === 1 ? "" : "s"
        } are waiting in the queue.`,
        ctaUrl: "/dashboard/transactions",
        ctaLabel: "Review ledger",
        tone: transactionState.summary.reviewCount > 0 ? "warning" : "secondary",
        createdAt: new Date().toISOString(),
      }),
    );
  }

  if (!candidates.length) {
    candidates.push(
      createNotification({
        ownerKey,
        eventKey: "workspace-stable",
        type: "system",
        title: "Workspace is stable right now",
        body: "No urgent finance or service alerts are standing out yet. Keep shipping activity and the inbox will start to tell the story.",
        ctaUrl: "/dashboard",
        ctaLabel: "Open overview",
        tone: "success",
        createdAt: new Date().toISOString(),
      }),
    );
  }

  return {
    notifications: sortNotifications(candidates).slice(0, 12),
    activity: buildActivityFeed({
      transactions: transactionState,
      insights: insightState,
      reports: reportState,
      bookings: bookingState,
    }),
    source:
      [budgetState, goalState, reportState, insightState, bookingState, accountantState, transactionState].some(
        (state) => state.source === "database",
      )
        ? ("database" as const)
        : ("demo" as const),
  };
}

async function syncDatabaseNotifications(
  viewer: ViewerContext,
  notifications: NotificationRecord[],
) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  try {
    await Promise.all(
      notifications.map((notification) =>
        context.prisma.notification.upsert({
          where: { id: notification.id },
          create: {
            id: notification.id,
            userId: context.userId,
            type: mapNotificationTypeToPrisma(notification.type),
            title: notification.title,
            body: notification.body,
            ctaUrl: notification.ctaUrl || null,
            createdAt: new Date(notification.createdAt),
          },
          update: {
            title: notification.title,
            body: notification.body,
            type: mapNotificationTypeToPrisma(notification.type),
            ctaUrl: notification.ctaUrl || null,
          },
        }),
      ),
    );

    const ephemeralByType: Array<[PrismaNotificationType, string[]]> = [
      [
        PrismaNotificationType.BUDGET_ALERT,
        notifications.filter((item) => item.type === "budget_alert").map((item) => item.id),
      ],
      [
        PrismaNotificationType.GOAL_UPDATE,
        notifications.filter((item) => item.type === "goal_update").map((item) => item.id),
      ],
      [
        PrismaNotificationType.SYSTEM,
        notifications.filter((item) => item.type === "system").map((item) => item.id),
      ],
    ];

    for (const [type, ids] of ephemeralByType) {
      await context.prisma.notification.deleteMany({
        where: {
          userId: context.userId,
          type,
          ...(ids.length ? { id: { notIn: ids } } : {}),
        },
      });
    }

    const stored = await context.prisma.notification.findMany({
      where: { userId: context.userId },
      orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
      take: 30,
    });

    return stored.map((notification) =>
      notificationRecordSchema.parse({
        id: notification.id,
        type:
          notification.type === PrismaNotificationType.BUDGET_ALERT
            ? "budget_alert"
            : notification.type === PrismaNotificationType.GOAL_UPDATE
              ? "goal_update"
              : notification.type === PrismaNotificationType.REPORT_READY
                ? "report_ready"
                : notification.type === PrismaNotificationType.SERVICE_STATUS
                  ? "service_status"
                  : "system",
        title: notification.title,
        body: notification.body,
        ctaUrl: notification.ctaUrl ?? "",
        ctaLabel:
          notifications.find((item) => item.id === notification.id)?.ctaLabel ??
          "Open workflow",
        tone:
          notifications.find((item) => item.id === notification.id)?.tone ??
          "neutral",
        readAt: notification.readAt?.toISOString() ?? "",
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString(),
      }),
    );
  } catch {
    return null;
  }
}

export async function getNotificationWorkspaceState(
  viewer: ViewerContext,
): Promise<NotificationWorkspaceState> {
  const derived = await buildNotificationCandidates(viewer);
  const databaseNotifications = await syncDatabaseNotifications(viewer, derived.notifications);

  if (databaseNotifications) {
    const sorted = sortNotifications(databaseNotifications).slice(0, 18);

    return notificationWorkspaceStateSchema.parse({
      notifications: sorted,
      summary: buildSummary(sorted),
      activity: derived.activity,
      source: "database",
    });
  }

  const readEntries = await readDemoReadState();
  const notifications = sortNotifications(applyReadState(derived.notifications, readEntries));

  return notificationWorkspaceStateSchema.parse({
    notifications,
    summary: buildSummary(notifications),
    activity: derived.activity,
    source: "demo",
  });
}

export async function updateNotificationReadState(
  viewer: ViewerContext,
  input: NotificationReadInput,
): Promise<NotificationMutationResult> {
  const parsedInput = notificationReadInputSchema.parse(input);
  const currentState = await getNotificationWorkspaceState(viewer);
  const context = await getDatabaseContext(viewer);

  if (context && currentState.source === "database") {
    const readAt = parsedInput.read ? new Date() : null;

    if (parsedInput.markAll) {
      await context.prisma.notification.updateMany({
        where: { userId: context.userId },
        data: { readAt },
      });
    } else if (parsedInput.ids.length) {
      await context.prisma.notification.updateMany({
        where: {
          userId: context.userId,
          id: { in: parsedInput.ids },
        },
        data: { readAt },
      });
    }

    const nextState = await getNotificationWorkspaceState(viewer);

    return {
      ...nextState,
      persistedReadState: [],
    };
  }

  const readEntries = await readDemoReadState();
  const readMap = new Map(readEntries.map((entry) => [entry.id, entry.readAt]));
  const targetIds = parsedInput.markAll
    ? currentState.notifications.map((notification) => notification.id)
    : parsedInput.ids;
  const nextReadAt = parsedInput.read ? new Date().toISOString() : "";

  for (const id of targetIds) {
    if (nextReadAt) {
      readMap.set(id, nextReadAt);
    } else {
      readMap.delete(id);
    }
  }

  const persistedReadState = Array.from(readMap.entries()).map(([id, readAt]) =>
    notificationReadCookieEntrySchema.parse({ id, readAt }),
  );
  const notifications = currentState.notifications.map((notification) =>
    notificationRecordSchema.parse({
      ...notification,
      readAt: readMap.get(notification.id) ?? "",
    }),
  );

  return {
    notifications,
    summary: buildSummary(notifications),
    activity: currentState.activity,
    source: "demo",
    persistedReadState,
  };
}

export function getSerializedNotificationReadStateCookie(
  entries: NotificationReadCookieEntry[],
) {
  return serializeDemoReadState(entries);
}

export function getNotificationReadCookieOptions() {
  return getNotificationCookieOptions();
}
