// View-model types for the schedule list/gantt. Real rows come from api.ts (toTask).
export type TaskStatus = "Done" | "In Progress" | "Blocked" | "Pending";

export interface Task {
  id: string;
  name: string;
  owner: string;
  ownerId?: string;
  initials: string;
  start: string;
  duration: string;
  status: TaskStatus;
  dependsOn?: string;
  delayed?: boolean;
}
