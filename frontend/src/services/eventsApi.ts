// src/services/eventsApi.ts
//
// Events API client. Mirrors the fetch/JSON/throw-on-error conventions used
// in authApi.ts, but reads its own env var so it doesn't depend on how the
// auth module's VITE_API_URL is scoped.

const API_BASE_URL =
  import.meta.env.VITE_EVENTS_API_URL || "http://localhost:5000/api/events";

export type EventStatusDTO = "draft" | "published" | "cancelled";

export interface EventStaffMember {
  _id: string;
  name: string;
  email: string;
}

export interface EventDTO {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  capacity?: number;
  status: EventStatusDTO;
  organizer: string;
  // Populated as ids on list/create, populated as {_id, name, email} after
  // an addStaff/removeStaff call (the backend's .populate('staff', ...)).
  staff: string[] | EventStaffMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EventListResponse {
  items: EventDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  capacity?: number;
  status?: EventStatusDTO;
}

export type UpdateEventInput = Partial<CreateEventInput>;

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle<T>(response: Response): Promise<T> {
  // DELETE returns 204 No Content — nothing to parse.
  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data as T;
}

export const eventsApi = {
  async list(
    params: { page?: number; limit?: number; status?: EventStatusDTO } = {}
  ): Promise<EventListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.status) query.set("status", params.status);

    const response = await fetch(`${API_BASE_URL}?${query.toString()}`, {
      headers: authHeaders(),
    });
    return handle<EventListResponse>(response);
  },

  async getById(id: string): Promise<EventDTO> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: authHeaders(),
    });
    return handle<EventDTO>(response);
  },

  async create(input: CreateEventInput): Promise<EventDTO> {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    return handle<EventDTO>(response);
  },

  async update(id: string, input: UpdateEventInput): Promise<EventDTO> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    return handle<EventDTO>(response);
  },

  async remove(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle<void>(response);
  },

  async addStaff(id: string, staffId: string): Promise<EventDTO> {
    const response = await fetch(`${API_BASE_URL}/${id}/staff`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ staffId }),
    });
    return handle<EventDTO>(response);
  },

  async removeStaff(id: string, staffId: string): Promise<EventDTO> {
    const response = await fetch(`${API_BASE_URL}/${id}/staff`, {
      method: "DELETE",
      headers: authHeaders(),
      body: JSON.stringify({ staffId }),
    });
    return handle<EventDTO>(response);
  },
};
