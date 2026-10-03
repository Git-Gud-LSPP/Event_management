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

  // Used for Gantt positioning
  startMinutes: number;
  durationMinutes: number;
  delayMinutes?: number;
}

export const timelineHours = [
  "6:00",
  "7:00",
  "8:00",
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
];
