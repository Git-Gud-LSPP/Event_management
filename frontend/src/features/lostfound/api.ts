import { apiFetch } from "../../services/api";

export interface LostItem {
  _id: string;
  event: string;
  item: string;
  description?: string;
  foundAt?: string;
  storedAt?: string;
  status: "Found" | "Claimed";
  claimedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type LostItemInput = Partial<Pick<LostItem, "item" | "description" | "foundAt" | "storedAt" | "status" | "claimedBy">>;

const base = (eventId: string) => `/events/${eventId}/lost-found`;

export const listLostItems = (eventId: string) => apiFetch<{ items: LostItem[]; total: number }>(base(eventId));
export const createLostItem = (eventId: string, data: LostItemInput) =>
  apiFetch<LostItem>(base(eventId), { method: "POST", body: JSON.stringify(data) });
export const updateLostItem = (eventId: string, id: string, data: LostItemInput) =>
  apiFetch<LostItem>(`${base(eventId)}/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteLostItem = (eventId: string, id: string) =>
  apiFetch<void>(`${base(eventId)}/${id}`, { method: "DELETE" });
