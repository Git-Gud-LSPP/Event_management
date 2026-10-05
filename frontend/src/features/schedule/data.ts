// View-model types for the schedule list/gantt. Real rows come from api.ts (toTask).
export type TaskStatus = "Done" | "In Progress" | "Blocked" | "Pending";

export interface Task {
  id: string;
  name: string;
  owner: string;
  ownerId?: string;
  initials: string;
  start: string;
  startsAt: string; // ISO, for grouping by day
  duration: string;
  status: TaskStatus;
  dependsOn?: string;
  delayed?: boolean;
}

export type Priority = "High" | "Medium" | "Low";

// The schedule has no priority field, so derive one for display: blocked or delayed work first.
export const priorityOf = (t: Task): Priority =>
  t.status === "Done" ? "Low" : t.status === "Blocked" || t.delayed ? "High" : "Medium";
