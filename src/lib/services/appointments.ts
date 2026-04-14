import "server-only";

import {
  AppointmentStatus as PrismaAppointmentStatus,
  MeetingMode as PrismaMeetingMode,
  RequestStatus as PrismaRequestStatus,
} from "@prisma/client";
import { cookies } from "next/headers";
import { z } from "zod";

import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getOnboardingState } from "@/lib/onboarding/server";
import { getAccountantWorkspaceState } from "@/lib/services/accountant";
import {
  accountantRequestInputSchema,
  accountantRequestStatusSchema,
  appointmentInputSchema,
  appointmentRecordSchema,
  appointmentUpdateSchema,
  bookingWorkspaceStateSchema,
} from "@/lib/validations/finance";
import type {
  AccountantRequestRecord,
  AppointmentInput,
  AppointmentRecord,
  AppointmentSummary,
  AppointmentUpdateInput,
  BookingWorkspaceState,
} from "@/types/finance";

export const appointmentCookieName = "afm-appointments";

const appointmentCookieEntrySchema = appointmentInputSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

const accountantRequestCookieEntrySchema = accountantRequestInputSchema.extend({
  id: z.string().uuid(),
  status: accountantRequestStatusSchema,
  adminNotes: z.string().max(500).optional().or(z.literal("")),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

type AppointmentCookieEntry = z.infer<typeof appointmentCookieEntrySchema>;
type AccountantRequestCookieEntry = z.infer<typeof accountantRequestCookieEntrySchema>;

type BookingMutationResult = {
  source: BookingWorkspaceState["source"];
  appointment: AppointmentRecord;
  appointments: AppointmentRecord[];
  requests: AccountantRequestRecord[];
  summary: AppointmentSummary;
  persistedAppointments: AppointmentCookieEntry[];
  persistedRequests: AccountantRequestCookieEntry[];
};

const demoAppointmentSeedMap = {
  personal: [] as const,
  freelancer: [
    {
      id: "07e4a090-42d4-42f4-b782-7b4bbf1b0001",
      requestId: "bcad6d21-55c3-4e5e-c123-12b98cf92002",
      meetingMode: "google_meet" as const,
      scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 45,
      meetingLink: "https://meet.google.com/demo-freelancer-tax",
      status: "confirmed" as const,
      offsetDays: -1,
    },
  ],
  business: [
    {
      id: "18f5b1a1-53e5-43a5-c893-8c5ccf2c0002",
      requestId: "cdbf7e32-66d4-4f6f-d234-23ca9dfa3003",
      meetingMode: "onsite" as const,
      scheduledFor: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      meetingLink: "",
      status: "completed" as const,
      offsetDays: -3,
    },
  ],
} satisfies Record<
  "personal" | "freelancer" | "business",
  readonly {
    id: string;
    requestId: string;
    meetingMode: AppointmentInput["meetingMode"];
    scheduledFor: string;
    durationMinutes: number;
    meetingLink: string;
    status: AppointmentInput["status"];
    offsetDays: number;
  }[]
>;

function getBookingSummary(appointments: AppointmentRecord[]): AppointmentSummary {
  const now = Date.now();

  return {
    totalCount: appointments.length,
    upcomingCount: appointments.filter(
      (appointment) =>
        new Date(appointment.scheduledFor).getTime() >= now &&
        ["pending", "confirmed", "rescheduled"].includes(appointment.status),
    ).length,
    pendingCount: appointments.filter((appointment) => appointment.status === "pending").length,
    confirmedCount: appointments.filter((appointment) => appointment.status === "confirmed").length,
    completedCount: appointments.filter((appointment) => appointment.status === "completed").length,
    cancelledCount: appointments.filter((appointment) => appointment.status === "cancelled").length,
  };
}

function sortAppointmentsForWorkspace(appointments: AppointmentRecord[]) {
  const statusOrder: Record<AppointmentRecord["status"], number> = {
    confirmed: 0,
    pending: 1,
    rescheduled: 2,
    completed: 3,
    cancelled: 4,
  };

  return [...appointments].sort((left, right) => {
    const statusDifference = statusOrder[left.status] - statusOrder[right.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    if (["confirmed", "pending", "rescheduled"].includes(left.status)) {
      return left.scheduledFor.localeCompare(right.scheduledFor);
    }

    return right.scheduledFor.localeCompare(left.scheduledFor);
  });
}

function mapMeetingMode(mode: PrismaMeetingMode): AppointmentInput["meetingMode"] {
  if (mode === PrismaMeetingMode.PHONE) {
    return "phone";
  }

  if (mode === PrismaMeetingMode.ONSITE) {
    return "onsite";
  }

  return "google_meet";
}

function mapMeetingModeToPrisma(mode: AppointmentInput["meetingMode"]) {
  if (mode === "phone") {
    return PrismaMeetingMode.PHONE;
  }

  if (mode === "onsite") {
    return PrismaMeetingMode.ONSITE;
  }

  return PrismaMeetingMode.GOOGLE_MEET;
}

function mapAppointmentStatus(status: PrismaAppointmentStatus): AppointmentInput["status"] {
  if (status === PrismaAppointmentStatus.CONFIRMED) {
    return "confirmed";
  }

  if (status === PrismaAppointmentStatus.COMPLETED) {
    return "completed";
  }

  if (status === PrismaAppointmentStatus.CANCELLED) {
    return "cancelled";
  }

  if (status === PrismaAppointmentStatus.RESCHEDULED) {
    return "rescheduled";
  }

  return "pending";
}

function mapAppointmentStatusToPrisma(status: AppointmentInput["status"]) {
  if (status === "confirmed") {
    return PrismaAppointmentStatus.CONFIRMED;
  }

  if (status === "completed") {
    return PrismaAppointmentStatus.COMPLETED;
  }

  if (status === "cancelled") {
    return PrismaAppointmentStatus.CANCELLED;
  }

  if (status === "rescheduled") {
    return PrismaAppointmentStatus.RESCHEDULED;
  }

  return PrismaAppointmentStatus.PENDING;
}

function mapRequestStatusToPrisma(status: AccountantRequestRecord["status"]) {
  if (status === "qualified") {
    return PrismaRequestStatus.QUALIFIED;
  }

  if (status === "scheduled") {
    return PrismaRequestStatus.SCHEDULED;
  }

  if (status === "in_progress") {
    return PrismaRequestStatus.IN_PROGRESS;
  }

  if (status === "completed") {
    return PrismaRequestStatus.COMPLETED;
  }

  if (status === "cancelled") {
    return PrismaRequestStatus.CANCELLED;
  }

  return PrismaRequestStatus.NEW;
}

function mapPrismaRequestStatus(status: PrismaRequestStatus): AccountantRequestRecord["status"] {
  if (status === PrismaRequestStatus.QUALIFIED) {
    return "qualified";
  }

  if (status === PrismaRequestStatus.SCHEDULED) {
    return "scheduled";
  }

  if (status === PrismaRequestStatus.IN_PROGRESS) {
    return "in_progress";
  }

  if (status === PrismaRequestStatus.COMPLETED) {
    return "completed";
  }

  if (status === PrismaRequestStatus.CANCELLED) {
    return "cancelled";
  }

  return "new";
}

function getRequestLabel(request: AccountantRequestRecord) {
  return request.packageLabel || request.requestType.replaceAll("_", " ");
}

function getNotificationMessage(appointment: AppointmentCookieEntry) {
  if (appointment.status === "confirmed") {
    return appointment.meetingLink
      ? "Meeting link confirmed and ready to share."
      : "Appointment confirmed and waiting on the final meeting link.";
  }

  if (appointment.status === "completed") {
    return "Consultation completed. The request can now move into active service follow-through.";
  }

  if (appointment.status === "cancelled") {
    return "Appointment cancelled. Rebook when the client and service lane are ready again.";
  }

  if (appointment.status === "rescheduled") {
    return "Appointment moved to a new slot. Keep the client updated with the latest schedule.";
  }

  return "Appointment submitted and waiting for service confirmation.";
}

function hydrateAppointmentRecord(
  appointment: AppointmentCookieEntry,
  requests: AccountantRequestRecord[],
) {
  const request = requests.find((candidate) => candidate.id === appointment.requestId);

  return appointmentRecordSchema.parse({
    ...appointment,
    requestLabel: request ? getRequestLabel(request) : "Accountant consultation",
    requestType: request?.requestType ?? "consultation",
    requestStatus: request?.status ?? "new",
    notificationMessage: getNotificationMessage(appointment),
  });
}

function deriveRequestStatus(
  request: Pick<AccountantRequestRecord, "id" | "status">,
  appointments: AppointmentCookieEntry[],
): AccountantRequestRecord["status"] {
  if (request.status === "completed") {
    return "completed";
  }

  const relatedAppointments = appointments.filter((appointment) => appointment.requestId === request.id);

  if (!relatedAppointments.length) {
    return request.status === "scheduled" ? "qualified" : request.status;
  }

  if (relatedAppointments.some((appointment) => appointment.status === "completed")) {
    return "in_progress";
  }

  if (
    relatedAppointments.some((appointment) =>
      ["pending", "confirmed", "rescheduled"].includes(appointment.status),
    )
  ) {
    return "scheduled";
  }

  if (relatedAppointments.every((appointment) => appointment.status === "cancelled")) {
    if (["in_progress", "completed"].includes(request.status)) {
      return request.status;
    }

    return request.status === "new" ? "qualified" : "qualified";
  }

  return request.status;
}

function applyRequestStatuses(
  requests: AccountantRequestRecord[],
  appointments: AppointmentCookieEntry[],
) {
  return requests.map((request) => ({
    ...request,
    status: deriveRequestStatus(request, appointments),
  }));
}

function buildWorkspaceState(
  requests: AccountantRequestRecord[],
  appointments: AppointmentRecord[],
  source: BookingWorkspaceState["source"],
): BookingWorkspaceState {
  const sortedAppointments = sortAppointmentsForWorkspace(appointments);

  return bookingWorkspaceStateSchema.parse({
    requests,
    appointments: sortedAppointments,
    summary: getBookingSummary(sortedAppointments),
    source,
  });
}

function buildAppointmentCookieEntriesFromState(state: BookingWorkspaceState) {
  return state.appointments.map((appointment) =>
    appointmentCookieEntrySchema.parse({
      id: appointment.id,
      requestId: appointment.requestId,
      meetingMode: appointment.meetingMode,
      scheduledFor: appointment.scheduledFor,
      durationMinutes: appointment.durationMinutes,
      meetingLink: appointment.meetingLink,
      status: appointment.status,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    }),
  );
}

function buildRequestCookieEntriesFromState(requests: AccountantRequestRecord[]) {
  return requests.map((request) =>
    accountantRequestCookieEntrySchema.parse({
      id: request.id,
      businessProfileId: request.businessProfileId,
      packageId: request.packageId,
      requestType: request.requestType,
      message: request.message,
      urgency: request.urgency,
      preferredDate: request.preferredDate,
      context: request.context,
      status: request.status,
      adminNotes: request.adminNotes,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }),
  );
}

function serializeAppointmentsCookie(appointments: AppointmentCookieEntry[]) {
  return JSON.stringify(appointmentCookieEntrySchema.array().parse(appointments));
}

function serializeAccountantRequestsCookie(requests: AccountantRequestCookieEntry[]) {
  return JSON.stringify(accountantRequestCookieEntrySchema.array().parse(requests));
}

function buildDemoAppointmentEntries(
  profileType: "personal" | "freelancer" | "business",
) {
  return demoAppointmentSeedMap[profileType].map((seed) => {
    const createdAt = new Date(Date.now() + seed.offsetDays * 24 * 60 * 60 * 1000).toISOString();

    return appointmentCookieEntrySchema.parse({
      id: seed.id,
      requestId: seed.requestId,
      meetingMode: seed.meetingMode,
      scheduledFor: seed.scheduledFor,
      durationMinutes: seed.durationMinutes,
      meetingLink: seed.meetingLink,
      status: seed.status,
      createdAt,
      updatedAt: createdAt,
    });
  });
}

async function readDemoAppointments(profileType: "personal" | "freelancer" | "business") {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(appointmentCookieName)?.value;

  if (!rawValue) {
    return buildDemoAppointmentEntries(profileType);
  }

  try {
    return appointmentCookieEntrySchema.array().parse(JSON.parse(rawValue));
  } catch {
    return buildDemoAppointmentEntries(profileType);
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

async function readDatabaseAppointments(
  viewer: ViewerContext,
  requests: AccountantRequestRecord[],
): Promise<AppointmentRecord[] | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const appointments = await context.prisma.appointment.findMany({
    where: { userId: context.userId },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
  });

  return appointments.map((appointment) =>
    hydrateAppointmentRecord(
      appointmentCookieEntrySchema.parse({
        id: appointment.id,
        requestId: appointment.requestId,
        meetingMode: mapMeetingMode(appointment.meetingMode),
        scheduledFor: appointment.scheduledFor.toISOString(),
        durationMinutes: appointment.durationMinutes,
        meetingLink: appointment.meetingLink ?? "",
        status: mapAppointmentStatus(appointment.status),
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString(),
      }),
      requests,
    ),
  );
}

function validateSlot(values: Pick<AppointmentInput, "scheduledFor" | "status">) {
  const scheduledTime = new Date(values.scheduledFor).getTime();

  if (!Number.isFinite(scheduledTime)) {
    throw new Error("Pick a valid booking date and time.");
  }

  if (!["completed", "cancelled"].includes(values.status) && scheduledTime < Date.now() - 5 * 60 * 1000) {
    throw new Error("Pick a future consultation slot.");
  }
}

function validateDuplicateSlot(
  appointments: AppointmentCookieEntry[],
  requestId: string,
  scheduledFor: string,
  currentAppointmentId?: string,
) {
  const duplicate = appointments.find(
    (appointment) =>
      appointment.requestId === requestId &&
      appointment.id !== currentAppointmentId &&
      appointment.scheduledFor === scheduledFor &&
      appointment.status !== "cancelled",
  );

  if (duplicate) {
    throw new Error("This request already has a booking at the selected time.");
  }
}

async function createDatabaseAppointment(
  viewer: ViewerContext,
  input: AppointmentInput,
): Promise<BookingMutationResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const request = await context.prisma.accountantRequest.findFirst({
    where: {
      id: input.requestId,
      userId: context.userId,
    },
  });

  if (!request) {
    throw new Error("The selected accountant request could not be found.");
  }

  const existingAppointments = await context.prisma.appointment.findMany({
    where: {
      userId: context.userId,
      requestId: input.requestId,
    },
  });

  validateSlot(input);
  validateDuplicateSlot(
    existingAppointments.map((appointment) =>
      appointmentCookieEntrySchema.parse({
        id: appointment.id,
        requestId: appointment.requestId,
        meetingMode: mapMeetingMode(appointment.meetingMode),
        scheduledFor: appointment.scheduledFor.toISOString(),
        durationMinutes: appointment.durationMinutes,
        meetingLink: appointment.meetingLink ?? "",
        status: mapAppointmentStatus(appointment.status),
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString(),
      }),
    ),
    input.requestId,
    input.scheduledFor,
  );

  const created = await context.prisma.appointment.create({
    data: {
      requestId: input.requestId,
      userId: context.userId,
      meetingMode: mapMeetingModeToPrisma(input.meetingMode),
      scheduledFor: new Date(input.scheduledFor),
      durationMinutes: input.durationMinutes,
      meetingLink: input.meetingLink || undefined,
      status: mapAppointmentStatusToPrisma(input.status),
    },
  });

  await context.prisma.accountantRequest.update({
    where: { id: input.requestId },
    data: {
      status: PrismaRequestStatus.SCHEDULED,
    },
  });

  const state = await getBookingWorkspaceState(viewer);
  const appointment = state.appointments.find((item) => item.id === created.id);

  if (!appointment) {
    return null;
  }

  return {
    source: "database",
    appointment,
    appointments: state.appointments,
    requests: state.requests,
    summary: state.summary,
    persistedAppointments: [],
    persistedRequests: [],
  };
}

async function updateDatabaseAppointment(
  viewer: ViewerContext,
  appointmentId: string,
  input: AppointmentUpdateInput,
): Promise<BookingMutationResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const existing = await context.prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      userId: context.userId,
    },
  });

  if (!existing) {
    return null;
  }

  const nextInput = appointmentInputSchema.parse({
    requestId: input.requestId ?? existing.requestId,
    meetingMode: input.meetingMode ?? mapMeetingMode(existing.meetingMode),
    scheduledFor: input.scheduledFor ?? existing.scheduledFor.toISOString(),
    durationMinutes: input.durationMinutes ?? existing.durationMinutes,
    meetingLink: input.meetingLink ?? existing.meetingLink ?? "",
    status: input.status ?? mapAppointmentStatus(existing.status),
  });

  validateSlot(nextInput);

  const siblingAppointments = await context.prisma.appointment.findMany({
    where: {
      userId: context.userId,
      requestId: nextInput.requestId,
    },
  });

  validateDuplicateSlot(
    siblingAppointments.map((appointment) =>
      appointmentCookieEntrySchema.parse({
        id: appointment.id,
        requestId: appointment.requestId,
        meetingMode: mapMeetingMode(appointment.meetingMode),
        scheduledFor: appointment.scheduledFor.toISOString(),
        durationMinutes: appointment.durationMinutes,
        meetingLink: appointment.meetingLink ?? "",
        status: mapAppointmentStatus(appointment.status),
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString(),
      }),
    ),
    nextInput.requestId,
    nextInput.scheduledFor,
    appointmentId,
  );

  await context.prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      requestId: nextInput.requestId,
      meetingMode: mapMeetingModeToPrisma(nextInput.meetingMode),
      scheduledFor: new Date(nextInput.scheduledFor),
      durationMinutes: nextInput.durationMinutes,
      meetingLink: nextInput.meetingLink || null,
      status: mapAppointmentStatusToPrisma(nextInput.status),
    },
  });

  const allAppointments = await context.prisma.appointment.findMany({
    where: {
      userId: context.userId,
    },
  });
  const allEntries = allAppointments.map((appointment) =>
    appointmentCookieEntrySchema.parse({
      id: appointment.id,
      requestId: appointment.requestId,
      meetingMode: mapMeetingMode(appointment.meetingMode),
      scheduledFor: appointment.scheduledFor.toISOString(),
      durationMinutes: appointment.durationMinutes,
      meetingLink: appointment.meetingLink ?? "",
      status: mapAppointmentStatus(appointment.status),
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    }),
  );
  const affectedRequestIds = [...new Set([existing.requestId, nextInput.requestId])];

  for (const requestId of affectedRequestIds) {
    const requestRecord = await context.prisma.accountantRequest.findFirst({
      where: {
        id: requestId,
        userId: context.userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!requestRecord) {
      continue;
    }

    await context.prisma.accountantRequest.update({
      where: { id: requestId },
      data: {
        status: mapRequestStatusToPrisma(
          deriveRequestStatus(
            {
              id: requestRecord.id,
              status: mapPrismaRequestStatus(requestRecord.status),
            },
            allEntries,
          ),
        ),
      },
    });
  }

  const state = await getBookingWorkspaceState(viewer);
  const appointment = state.appointments.find((item) => item.id === appointmentId);

  if (!appointment) {
    return null;
  }

  return {
    source: "database",
    appointment,
    appointments: state.appointments,
    requests: state.requests,
    summary: state.summary,
    persistedAppointments: [],
    persistedRequests: [],
  };
}

export function getAppointmentCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export async function getBookingWorkspaceState(
  viewer: ViewerContext,
): Promise<BookingWorkspaceState> {
  const accountantState = await getAccountantWorkspaceState(viewer);
  const databaseAppointments = await readDatabaseAppointments(viewer, accountantState.requests);

  if (databaseAppointments) {
    return buildWorkspaceState(accountantState.requests, databaseAppointments, "database");
  }

  const onboardingState = await getOnboardingState(viewer);
  const profileType = onboardingState.profileType;
  const demoAppointments = await readDemoAppointments(profileType);
  const nextRequests = applyRequestStatuses(accountantState.requests, demoAppointments);
  const appointmentRecords = demoAppointments.map((appointment) =>
    hydrateAppointmentRecord(appointment, nextRequests),
  );

  return buildWorkspaceState(nextRequests, appointmentRecords, "demo");
}

export async function createAppointment(
  viewer: ViewerContext,
  input: AppointmentInput,
): Promise<BookingMutationResult> {
  const parsedInput = appointmentInputSchema.parse(input);
  const databaseResult = await createDatabaseAppointment(viewer, parsedInput);

  if (databaseResult) {
    return databaseResult;
  }

  validateSlot(parsedInput);

  const accountantState = await getAccountantWorkspaceState(viewer);
  const persistedAppointments = buildAppointmentCookieEntriesFromState(
    await getBookingWorkspaceState(viewer),
  );
  validateDuplicateSlot(persistedAppointments, parsedInput.requestId, parsedInput.scheduledFor);

  const now = new Date().toISOString();
  const nextEntry = appointmentCookieEntrySchema.parse({
    ...parsedInput,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  });
  const nextPersistedAppointments = [nextEntry, ...persistedAppointments];
  const nextRequests = applyRequestStatuses(accountantState.requests, nextPersistedAppointments);
  const nextPersistedRequests = buildRequestCookieEntriesFromState(nextRequests);
  const appointments = nextPersistedAppointments.map((appointment) =>
    hydrateAppointmentRecord(appointment, nextRequests),
  );
  const workspaceState = buildWorkspaceState(nextRequests, appointments, "demo");

  return {
    source: "demo",
    appointment: appointments.find((appointment) => appointment.id === nextEntry.id) ?? appointments[0],
    appointments: workspaceState.appointments,
    requests: workspaceState.requests,
    summary: workspaceState.summary,
    persistedAppointments: nextPersistedAppointments,
    persistedRequests: nextPersistedRequests,
  };
}

export async function updateAppointment(
  viewer: ViewerContext,
  appointmentId: string,
  input: AppointmentUpdateInput,
): Promise<BookingMutationResult | null> {
  const parsedInput = appointmentUpdateSchema.parse(input);
  const databaseResult = await updateDatabaseAppointment(viewer, appointmentId, parsedInput);

  if (databaseResult) {
    return databaseResult;
  }

  const currentState = await getBookingWorkspaceState(viewer);
  const persistedAppointments = buildAppointmentCookieEntriesFromState(currentState);
  const existing = persistedAppointments.find((appointment) => appointment.id === appointmentId);

  if (!existing) {
    return null;
  }

  const nextAppointment = appointmentInputSchema.parse({
    requestId: parsedInput.requestId ?? existing.requestId,
    meetingMode: parsedInput.meetingMode ?? existing.meetingMode,
    scheduledFor: parsedInput.scheduledFor ?? existing.scheduledFor,
    durationMinutes: parsedInput.durationMinutes ?? existing.durationMinutes,
    meetingLink: parsedInput.meetingLink ?? existing.meetingLink ?? "",
    status: parsedInput.status ?? existing.status,
  });

  validateSlot(nextAppointment);
  validateDuplicateSlot(
    persistedAppointments,
    nextAppointment.requestId,
    nextAppointment.scheduledFor,
    appointmentId,
  );

  const nextPersistedAppointments = persistedAppointments.map((appointment) =>
    appointment.id === appointmentId
      ? appointmentCookieEntrySchema.parse({
          ...appointment,
          ...nextAppointment,
          updatedAt: new Date().toISOString(),
        })
      : appointment,
  );
  const nextRequests = applyRequestStatuses(currentState.requests, nextPersistedAppointments);
  const nextPersistedRequests = buildRequestCookieEntriesFromState(nextRequests);
  const appointments = nextPersistedAppointments.map((appointment) =>
    hydrateAppointmentRecord(appointment, nextRequests),
  );
  const workspaceState = buildWorkspaceState(nextRequests, appointments, "demo");
  const updatedAppointment = workspaceState.appointments.find(
    (appointment) => appointment.id === appointmentId,
  );

  if (!updatedAppointment) {
    return null;
  }

  return {
    source: "demo",
    appointment: updatedAppointment,
    appointments: workspaceState.appointments,
    requests: workspaceState.requests,
    summary: workspaceState.summary,
    persistedAppointments: nextPersistedAppointments,
    persistedRequests: nextPersistedRequests,
  };
}

export function getSerializedAppointmentsCookie(appointments: AppointmentCookieEntry[]) {
  return serializeAppointmentsCookie(appointments);
}

export function getSerializedAccountantRequestsCookieForAppointments(
  requests: AccountantRequestCookieEntry[],
) {
  return serializeAccountantRequestsCookie(requests);
}
