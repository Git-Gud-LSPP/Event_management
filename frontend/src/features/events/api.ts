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

export type EventInput = Partial<Omit<EventRecord, "_id" | "organizer" | "staff">>;

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
