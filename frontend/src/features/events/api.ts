import { apiFetch } from "../../services/api";

export type EventStatus = "draft" | "published" | "cancelled";

export interface StaffRef {
  _id: string;
  name: string;
  email: string;
}

export interface EventRecord {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  capacity?: number;
  status: EventStatus;
  organizer: string;
  staff: StaffRef[];
}

// null clears an optional field on update (undefined would leave it unchanged).
export type EventInput = Partial<Omit<EventRecord, "_id" | "organizer" | "staff" | "endsAt" | "capacity">> & {
  endsAt?: string | null;
  capacity?: number | null;
};

export const listEvents = () =>
  apiFetch<{ items: EventRecord[]; total: number }>("/events?limit=100");

export const getEvent = (id: string) => apiFetch<EventRecord>(`/events/${id}`);

export const createEvent = (data: EventInput) =>
  apiFetch<EventRecord>("/events", { method: "POST", body: JSON.stringify(data) });

export const updateEvent = (id: string, data: EventInput) =>
  apiFetch<EventRecord>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const deleteEvent = (id: string) =>
  apiFetch<void>(`/events/${id}`, { method: "DELETE" });

export const addStaff = (eventId: string, staffId: string) =>
  apiFetch<EventRecord>(`/events/${eventId}/staff`, {
    method: "POST",
    body: JSON.stringify({ staffId }),
  });

export const removeStaff = (eventId: string, staffId: string) =>
  apiFetch<EventRecord>(`/events/${eventId}/staff`, {
    method: "DELETE",
    body: JSON.stringify({ staffId }),
  });

export interface InventoryRecord {
  _id: string;
  name: string;
  category?: string;
  stock: number;
  maxStock: number;
  location?: string;
  status: "Available" | "Low Stock" | "Damaged" | "Checked Out" | "Ordered";
}

export const listInventory = (eventId: string) =>
  apiFetch<{ items: InventoryRecord[]; total: number }>(`/events/${eventId}/inventory`);

export interface DependencyChainRecord {
  id: string;
  trigger: { taskId: string; label: string; type: "delay" | "blocked"; time: string };
  chain: Array<{ id: string; label: string; impact: string; severity: "high" | "critical" }>;
}

export const listDependencyChains = (eventId: string) =>
  apiFetch<{ items: DependencyChainRecord[] }>(`/events/${eventId}/schedule/chains`);
