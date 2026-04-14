"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getRequestBookingLabel, toDateTimeLocalValue } from "@/features/bookings/booking-utils";
import type { BookingSchedulerMode } from "@/types/bookings";
import { appointmentInputSchema } from "@/lib/validations/finance";
import type {
  AccountantRequestRecord,
  AppointmentFormInput,
  AppointmentInput,
  AppointmentRecord,
} from "@/types/finance";

const appointmentSchedulerSchema = appointmentInputSchema.extend({
  scheduledFor: z.string().min(1, "Pick a consultation date and time."),
});

type AppointmentSchedulerValues = z.infer<typeof appointmentSchedulerSchema>;

type AppointmentSchedulerCardProps = {
  mode: BookingSchedulerMode;
  requests: AccountantRequestRecord[];
  selectedRequestId?: string | null;
  activeAppointment?: AppointmentRecord | null;
  onSelectRequest: (requestId: string) => void;
  onSubmit: (values: AppointmentInput) => Promise<void>;
  onResetMode: () => void;
};

function getDefaultScheduledFor(request?: AccountantRequestRecord | null) {
  if (request?.preferredDate) {
    return toDateTimeLocalValue(request.preferredDate);
  }

  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 2);

  return toDateTimeLocalValue(now.toISOString());
}

function getDefaultValues(
  mode: BookingSchedulerMode,
  request: AccountantRequestRecord | null | undefined,
  appointment?: AppointmentRecord | null,
): AppointmentFormInput {
  if (mode === "edit" && appointment) {
    return {
      requestId: appointment.requestId,
      meetingMode: appointment.meetingMode,
      scheduledFor: toDateTimeLocalValue(appointment.scheduledFor),
      durationMinutes: appointment.durationMinutes,
      meetingLink: appointment.meetingLink,
      status: appointment.status,
    };
  }

  return {
    requestId: request?.id ?? "",
    meetingMode: "google_meet",
    scheduledFor: getDefaultScheduledFor(request),
    durationMinutes: 30,
    meetingLink: "",
    status: "pending",
  };
}

export function AppointmentSchedulerCard({
  mode,
  requests,
  selectedRequestId,
  activeAppointment,
  onSelectRequest,
  onSubmit,
  onResetMode,
}: AppointmentSchedulerCardProps) {
  const selectedRequest =
    requests.find((request) => request.id === selectedRequestId) ?? requests[0] ?? null;
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormInput, undefined, AppointmentSchedulerValues>({
    resolver: zodResolver(appointmentSchedulerSchema),
    defaultValues: getDefaultValues(mode, selectedRequest, activeAppointment),
  });

  useEffect(() => {
    reset(getDefaultValues(mode, selectedRequest, activeAppointment));
  }, [activeAppointment, mode, reset, selectedRequest]);

  async function handleValidSubmit(values: AppointmentSchedulerValues) {
    await onSubmit({
      requestId: values.requestId,
      meetingMode: values.meetingMode,
      scheduledFor: new Date(values.scheduledFor).toISOString(),
      durationMinutes: values.durationMinutes,
      meetingLink: values.meetingLink,
      status: mode === "create" ? "pending" : values.status,
    });
  }

  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">
          {mode === "create" ? "Scheduler" : "Reschedule and confirm"}
        </p>
        <CardTitle className="mt-3">
          {mode === "create"
            ? "Create a consultation slot"
            : "Update booking details and service confirmation"}
        </CardTitle>
        <CardDescription className="mt-2">
          {mode === "create"
            ? "Choose a request, pick the meeting mode, and capture the first consultation slot."
            : "This edit flow also covers admin-style confirmation details like the meeting link and status progression."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleValidSubmit)} className="space-y-5">
          <FormField
            label="Accountant request"
            htmlFor="booking-request-id"
            error={errors.requestId?.message}
          >
            <Select
              id="booking-request-id"
              {...register("requestId")}
              onChange={(event) => {
                register("requestId").onChange(event);
                onSelectRequest(event.target.value);
              }}
            >
              {requests.map((request) => (
                <option key={request.id} value={request.id}>
                  {getRequestBookingLabel(request)}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Meeting mode"
              htmlFor="booking-mode"
              error={errors.meetingMode?.message}
            >
              <Select id="booking-mode" {...register("meetingMode")}>
                <option value="google_meet">Google Meet</option>
                <option value="phone">Phone</option>
                <option value="onsite">Onsite</option>
              </Select>
            </FormField>

            <FormField
              label="Duration"
              htmlFor="booking-duration"
              error={errors.durationMinutes?.message}
            >
              <Select id="booking-duration" {...register("durationMinutes", { valueAsNumber: true })}>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </Select>
            </FormField>
          </div>

          <FormField
            label="Scheduled for"
            htmlFor="booking-scheduled-for"
            error={errors.scheduledFor?.message}
          >
            <Input id="booking-scheduled-for" type="datetime-local" {...register("scheduledFor")} />
          </FormField>

          <FormField
            label="Meeting link"
            htmlFor="booking-meeting-link"
            hint="Optional at creation time. This becomes useful when the consultation is confirmed."
            error={errors.meetingLink?.message}
          >
            <Input
              id="booking-meeting-link"
              placeholder="https://meet.google.com/..."
              {...register("meetingLink")}
            />
          </FormField>

          {mode === "edit" ? (
            <FormField label="Booking status" htmlFor="booking-status" error={errors.status?.message}>
              <Select id="booking-status" {...register("status")}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FormField>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-black/6 pt-6 sm:flex-row sm:justify-end">
            {mode === "edit" ? (
              <Button type="button" variant="secondary" onClick={onResetMode}>
                Switch to new booking
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting || !requests.length}>
              {isSubmitting
                ? mode === "create"
                  ? "Creating booking..."
                  : "Saving changes..."
                : mode === "create"
                  ? "Create booking"
                  : "Save booking changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
