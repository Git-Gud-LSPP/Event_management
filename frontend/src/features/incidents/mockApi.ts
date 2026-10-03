import { getStoredUser } from "../../services/authApi";
import type { StaffRef } from "../events/api";
import type {
  IncidentInput,
  IncidentPriority,
  IncidentRecord,
  IncidentStatus,
} from "./api";

let incidents: IncidentRecord[] = [];
let nextId = 1;
const staffDirectory = new Map<string, StaffRef>();

const delay = <T>(value: T, ms = 250) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const clone = (i: IncidentRecord): IncidentRecord => ({ ...i });

export const noteStaff = (staff: StaffRef[]) => {
  for (const s of staff) staffDirectory.set(s._id, s);
};

const resolveStaff = (id: string): StaffRef =>
  staffDirectory.get(id) ?? { _id: id, name: "Unknown staff", email: "" };

const currentUserAsStaffRef = (): StaffRef => {
  const user = getStoredUser();
  return user
    ? { _id: user.id, name: user.name, email: user.email }
    : { _id: "unknown", name: "Unknown organizer", email: "" };
};

export const listIncidents = (eventId: string) => {
  const items = incidents.filter((i) => i.event === eventId).map(clone);
  return delay({ items, total: items.length });
};

export const getIncident = (eventId: string, id: string) => {
  const found = incidents.find((i) => i.event === eventId && i._id === id);
  if (!found) return Promise.reject(new Error("Incident not found"));
  return delay(clone(found));
};

export const createIncident = (eventId: string, data: IncidentInput) => {
  const now = new Date().toISOString();
  const created: IncidentRecord = {
    _id: `inc-${nextId++}`,
    event: eventId,
    title: data.title,
    description: data.description,
    location: data.location,
    priority: data.priority,
    status: "Open",
    reportedBy: currentUserAsStaffRef(),
    assignedTo: data.assignedTo ? resolveStaff(data.assignedTo) : null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  };
  incidents.push(created);
  return delay(clone(created));
};

export const updateIncidentStatus = (
  eventId: string,
  id: string,
  status: IncidentStatus
) => {
  const item = incidents.find((i) => i.event === eventId && i._id === id);
  if (!item) return Promise.reject(new Error("Incident not found"));
  item.status = status;
  item.updatedAt = new Date().toISOString();
  item.resolvedAt = status === "Resolved" ? item.updatedAt : null;
  return delay(clone(item));
};

export const assignIncident = (
  eventId: string,
  id: string,
  staffId: string
) => {
  const item = incidents.find((i) => i.event === eventId && i._id === id);
  if (!item) return Promise.reject(new Error("Incident not found"));
  item.assignedTo = resolveStaff(staffId);
  item.updatedAt = new Date().toISOString();
  return delay(clone(item));
};

export const deleteIncident = (eventId: string, id: string) => {
  incidents = incidents.filter((i) => !(i.event === eventId && i._id === id));
  return delay(undefined as void);
};

export type { IncidentPriority, IncidentRecord, IncidentStatus };
