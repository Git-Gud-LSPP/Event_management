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

export const claimTask = (eventId: string, id: string) =>
  apiFetch<ScheduleItem>(`${base(eventId)}/${id}/claim`, { method: "POST" });

export const assignTask = (eventId: string, id: string, assigneeId: string) =>
  apiFetch<ScheduleItem>(`${base(eventId)}/${id}/tasks-assign`, {
    method: "POST",
    body: JSON.stringify({ assigneeId }),
  });

// The unfinished task (if any) that already has `ownerId` busy during `slot`. A task with no end
// time occupies just its start minute.
export const clashFor = (
  items: ScheduleItem[],
  ownerId: string,
  slot: { _id?: string; startsAt: string; endsAt?: string }
): ScheduleItem | undefined => {
  const span = (t: { startsAt: string; endsAt?: string }) => {
    const start = new Date(t.startsAt).getTime();
    return [start, Math.max(start + 60_000, t.endsAt ? new Date(t.endsAt).getTime() : 0)];
  };
  const [start, end] = span(slot);
  return items.find((i) => {
    if (i._id === slot._id || i.owner?._id !== ownerId || i.status === "Done") return false;
    const [s, e] = span(i);
    return s < end && start < e;
  });
};

// --- mapping backend shape -> the shape the list/gantt views already render ---

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export const toTask = (item: ScheduleItem): Task => {
  const start = new Date(item.startsAt);
  const end = item.endsAt ? new Date(item.endsAt) : null;
  const durationMinutes = end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : 0;

  return {
    id: item._id,
    name: item.name,
    owner: item.owner?.name ?? "Unassigned",
    ownerId: item.owner?._id,
    initials: item.owner ? initialsOf(item.owner.name) : "—",
    start: start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    startsAt: item.startsAt,
    duration: `${durationMinutes}m`,
    status: item.status,
    dependsOn: item.dependsOn?.name,
    delayed: (item.delayMinutes ?? 0) > 0,
  };
};
