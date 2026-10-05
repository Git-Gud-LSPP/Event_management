import { API_BASE, apiFetch } from "../../services/api";

export type ActionStatus = "pending" | "running" | "done" | "failed" | "cancelled";

export interface AgentAction {
  id: string;
  summary: string;
  status: ActionStatus;
  error: string | null;
}

export type ToolStatus = "running" | "done" | "error";

// Events streamed by POST /api/agent/chat (see backend/agent/agent.controller.js).
export type AgentEvent =
  | { type: "text"; text: string }
  | { type: "tool"; id: string; name: string; status: ToolStatus }
  | { type: "confirm"; action: AgentAction }
  | { type: "ui"; action: "navigate"; path: string; eventId: string | null }
  | { type: "changed" }
  | { type: "error"; message: string }
  | { type: "done" };

export interface ChatContext {
  path: string;
  eventId: string | null;
  now: string;
  timezone: string;
}

// File content travels base64 in the JSON body; the backend extracts the text.
export interface Attachment {
  name: string;
  data: string;
}

// Mirrors backend/agent/agent.documents.js.
export const ATTACH_ACCEPT = ".pdf,.docx,.xlsx,.csv,.tsv,.txt,.md,.json";
export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const fileToAttachment = (file: File) =>
  new Promise<Attachment>((resolve, reject) => {
    const reader = new FileReader();
    // result is "data:<mime>;base64,<data>"
    reader.onload = () => resolve({ name: file.name, data: String(reader.result).split(",")[1] ?? "" });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });

export interface Conversation {
  messages: { role: "user" | "assistant"; text: string }[];
  pendingActions: AgentAction[];
}

// apiFetch parses JSON in one go, so the streaming endpoint reads the body by hand.
export async function streamChat(
  message: string,
  context: ChatContext,
  onEvent: (event: AgentEvent) => void,
  signal: AbortSignal,
  attachments: Attachment[] = []
) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${API_BASE}/agent/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, context, ...(attachments.length ? { attachments } : {}) }),
    signal,
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end;
    while ((end = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      if (frame.startsWith("data: ")) onEvent(JSON.parse(frame.slice(6)) as AgentEvent);
    }
  }
}

export const getConversation = () => apiFetch<Conversation>("/agent/conversation");

export const resetConversation = () =>
  apiFetch<void>("/agent/conversation", { method: "DELETE" });

export const confirmAction = (id: string) =>
  apiFetch<AgentAction>(`/agent/actions/${id}/confirm`, { method: "POST" });

export const cancelAction = (id: string) =>
  apiFetch<AgentAction>(`/agent/actions/${id}/cancel`, { method: "POST" });
