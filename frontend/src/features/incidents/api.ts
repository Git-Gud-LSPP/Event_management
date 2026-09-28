import { apiFetch } from "../../services/api";
import type { StaffRef } from "../events/api";

export type IncidentPriority = "Low" | "Medium" | "Critical";
export type IncidentStatus = "Open" | "In Progress" | "Resolved";

export interface IncidentRecord {
  _id: string;
  event: string;
  title: string;
  description?: string;
  location?: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  reportedBy: StaffRef;
  assignedTo?: StaffRef | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

// What the organizer supplies when reporting/editing an incident
export interface IncidentInput {
  title: string;
  description?: string;
  location?: string;
  priority: IncidentPriority;
  assignedTo?: string | null;
}

const base = (eventId: string) => `/events/${eventId}/incidents`;

export const listIncidents = (eventId: string) =>
  apiFetch<{ items: IncidentRecord[]; total: number }>(
    `${base(eventId)}?limit=100`
  );

export const getIncident = (eventId: string, id: string) =>
  apiFetch<IncidentRecord>(`${base(eventId)}/${id}`);

export const createIncident = (eventId: string, data: IncidentInput) =>
  apiFetch<IncidentRecord>(base(eventId), {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateIncidentStatus = (
  eventId: string,
  id: string,
  status: IncidentStatus
) =>
  apiFetch<IncidentRecord>(`${base(eventId)}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// Organizer-only. Backend must validate staffid is in event.staff
// same as schedule's /tasks-assign.
export const assignIncident = (eventId: string, id: string, staffId: string) =>
  apiFetch<IncidentRecord>(`${base(eventId)}/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ staffId }),
  });

export const deleteIncident = (eventId: string, id: string) =>
  apiFetch<void>(`${base(eventId)}/${id}`, { method: "DELETE" });
