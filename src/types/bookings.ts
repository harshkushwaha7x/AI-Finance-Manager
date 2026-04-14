export type BookingChecklistItem = {
  id: string;
  label: string;
  description: string;
  completed: boolean;
};

export type BookingSchedulerMode = "create" | "edit";
