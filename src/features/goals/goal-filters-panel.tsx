"use client";

import { RotateCcw } from "lucide-react";

import { SectionToolbar } from "@/components/shared/section-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import type { GoalPageFilters } from "@/types/goals";

type GoalFiltersPanelProps = {
  filters: GoalPageFilters;
  onFiltersChange: (filters: GoalPageFilters) => void;
  onReset: () => void;
};

export function GoalFiltersPanel({
  filters,
  onFiltersChange,
  onReset,
}: GoalFiltersPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <SectionToolbar
          title="Goal filters"
          description="Switch between priority and status slices before funding or editing a target."
          actions={
            <Button variant="secondary" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-5">
        <FormField label="Priority" htmlFor="goal-filter-priority">
          <Select
            id="goal-filter-priority"
            value={filters.priority}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                priority: event.target.value,
              })
            }
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="goal-filter-status">
          <Select
            id="goal-filter-status"
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target.value,
              })
            }
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </Select>
        </FormField>
        <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4 text-sm leading-7 text-muted">
          Goals now feed a live progress layer into the dashboard, so status changes and contributions immediately update the broader finance story.
        </div>
      </CardContent>
    </Card>
  );
}
