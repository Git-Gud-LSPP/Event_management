import { API_BASE, apiFetch } from "../../services/api";
import type { StaffRef } from "../events/api";
import type { Attachment } from "../agent/api";

// Mirror backend/document/document.model.js and backend/procurement/procurement.model.js.
export const DOC_CATEGORIES = [
  "Contract", "Quote", "RFQ", "Purchase Order", "Invoice", "Receipt",
  "Permit", "Insurance", "Plan", "Other",
] as const;
export const DOC_STATUSES = ["Draft", "Sent", "Received", "Approved", "Signed", "Paid", "Void"] as const;
export const VENDOR_STAGES = ["Shortlisted", "RFQ Sent", "Quoted", "Booked", "Paid", "Rejected"] as const;
export const DOC_ACCEPT = ".pdf,.docx,.xlsx,.csv,.tsv,.txt,.md,.json,.png,.jpg,.jpeg,.webp";

export type DocCategory = (typeof DOC_CATEGORIES)[number];
export type DocStatus = (typeof DOC_STATUSES)[number];
export type VendorStage = (typeof VENDOR_STAGES)[number];

export interface EventVendor {
  _id: string;
  name: string;
  type?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  sourceId?: string;
  stage: VendorStage;
  scope?: string;
  quoteAmount?: number;
  currency?: string;
  notes?: string;
}

export interface DocumentRecord {
  _id: string;
  title: string;
  category: DocCategory;
  status: DocStatus;
  vendor: Pick<EventVendor, "_id" | "name" | "type" | "stage"> | null;
  amount?: number;
  currency?: string;
  dueDate?: string;
  content?: string; // only on getDocument
  file?: { name: string; mime: string; size: number };
  sharedWith?: string[]; // staff ids who can see it
  createdBy: StaffRef;
  createdAt: string;
  updatedAt: string;
}

// null clears an optional field on update.
export interface DocumentInput {
  title?: string;
  category?: DocCategory;
  status?: DocStatus;
  vendor?: string | null;
  amount?: number | null;
  currency?: string;
  dueDate?: string | null;
  content?: string;
  file?: Attachment;
  sharedWith?: string[];
}

const docs = (eventId: string) => `/events/${eventId}/documents`;
const vendors = (eventId: string) => `/events/${eventId}/vendors`;
const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

export const listDocuments = (eventId: string) =>
  apiFetch<{ items: DocumentRecord[] }>(docs(eventId)).then((r) => r.items);
export const getDocument = (eventId: string, id: string) => apiFetch<DocumentRecord>(`${docs(eventId)}/${id}`);
export const createDocument = (eventId: string, data: DocumentInput) =>
  apiFetch<DocumentRecord>(docs(eventId), json("POST", data));
export const generateDocument = (
  eventId: string,
  data: { spec: string; title?: string; category?: DocCategory; vendor?: string },
) => apiFetch<{ content: string }>(`${docs(eventId)}/generate`, json("POST", data)).then((r) => r.content);
export const updateDocument = (eventId: string, id: string, data: DocumentInput) =>
  apiFetch<DocumentRecord>(`${docs(eventId)}/${id}`, json("PATCH", data));
export const deleteDocument = (eventId: string, id: string) =>
  apiFetch<void>(`${docs(eventId)}/${id}`, { method: "DELETE" });

const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
};

// Uploaded files come from the API (needs the token); written documents download as Markdown.
export async function downloadDocument(eventId: string, doc: DocumentRecord) {
  if (!doc.file) {
    const full = doc.content === undefined ? await getDocument(eventId, doc._id) : doc;
    return saveBlob(new Blob([full.content || ""], { type: "text/markdown" }), `${doc.title}.md`);
  }
  const res = await fetch(`${API_BASE}${docs(eventId)}/${doc._id}/file`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("authToken") || ""}` },
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  saveBlob(await res.blob(), doc.file.name);
}

export const listEventVendors = (eventId: string) =>
  apiFetch<{ items: EventVendor[] }>(vendors(eventId)).then((r) => r.items);
export const addEventVendor = (eventId: string, data: Partial<EventVendor>) =>
  apiFetch<EventVendor>(vendors(eventId), json("POST", data));
export const updateEventVendor = (eventId: string, id: string, data: Partial<EventVendor>) =>
  apiFetch<EventVendor>(`${vendors(eventId)}/${id}`, json("PATCH", data));
export const removeEventVendor = (eventId: string, id: string) =>
  apiFetch<void>(`${vendors(eventId)}/${id}`, { method: "DELETE" });
