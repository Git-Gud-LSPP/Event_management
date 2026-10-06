import { apiFetch } from "../../services/api";

export const BUDGET_CATEGORIES = ["Venue", "Catering", "AV & production", "Staffing", "Marketing", "Travel", "Other"] as const;

export interface BudgetLine {
  _id: string;
  event: string;
  name: string;
  category: string;
  planned: number;
  actual: number;
  owner?: string;
  notes?: string;
}

export type BudgetInput = Partial<Omit<BudgetLine, "_id" | "event">>;

const base = (eventId: string) => `/events/${eventId}/budget`;

export const listBudget = (eventId: string) => apiFetch<{ items: BudgetLine[]; total: number }>(base(eventId));
export const createBudgetLine = (eventId: string, data: BudgetInput) =>
  apiFetch<BudgetLine>(base(eventId), { method: "POST", body: JSON.stringify(data) });
export const updateBudgetLine = (eventId: string, id: string, data: BudgetInput) =>
  apiFetch<BudgetLine>(`${base(eventId)}/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteBudgetLine = (eventId: string, id: string) =>
  apiFetch<void>(`${base(eventId)}/${id}`, { method: "DELETE" });

export const money = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
