import { apiFetch } from "../../services/api";
import type { Task, TaskStatus } from "./data";

export interface ScheduleItem {
  _id: string;
  event: string;
  name: string;
  owner?: { _id: string; name: string; email: string } | null;
  startsAt: string;
  endsAt?: string;
  status: TaskStatus;
  dependsOn?: { _id: string; name: string } | null;
  delayMinutes?: number;
}

const base = (eventId: string) => `/events/${eventId}/schedule`;

export const listSchedule = (eventId: string) =>
  apiFetch<{ items: ScheduleItem[]; total: number }>(`${base(eventId)}?limit=100`);

export const createTask = (eventId: string, data: Partial<ScheduleItem>) =>
  apiFetch<ScheduleItem>(base(eventId), { method: "POST", body: JSON.stringify(data) });

export const updateTask = (eventId: string, id: string, data: Partial<ScheduleItem>) =>
  apiFetch<ScheduleItem>(`${base(eventId)}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteTask = (eventId: string, id: string) =>
  apiFetch<void>(`${base(eventId)}/${id}`, { method: "DELETE" });

export const assignTask = (eventId: string, id: string, assigneeId: string) =>
  apiFetch<ScheduleItem>(`${base(eventId)}/${id}/tasks-assign`, {
    method: "POST",
    body: JSON.stringify({ assigneeId }),
  });

// --- mapping backend shape -> the shape the list/gantt views already render ---

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

// ponytail: the Gantt is hardcoded to a 6:00am-2:00pm window (see timelineHours),
// so positions are minutes-since-6am on the task's own day. Make the window
// data-driven if events outside those hours need to render.
const GANTT_START_HOUR = 6;

export const toTask = (item: ScheduleItem): Task => {
  const start = new Date(item.startsAt);
  const end = item.endsAt ? new Date(item.endsAt) : null;
  const durationMinutes = end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : 0;
  const startMinutes = (start.getHours() - GANTT_START_HOUR) * 60 + start.getMinutes();

  return {
    id: item._id,
    name: item.name,
    owner: item.owner?.name ?? "Unassigned",
    ownerId: item.owner?._id,
    initials: item.owner ? initialsOf(item.owner.name) : "—",
    start: start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    duration: `${durationMinutes}m`,
    status: item.status,
    dependsOn: item.dependsOn?.name,
    delayed: (item.delayMinutes ?? 0) > 0,
    startMinutes,
    durationMinutes,
    delayMinutes: item.delayMinutes,
  };
};
