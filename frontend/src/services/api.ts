// Single place the frontend learns where the backend lives.
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  // Expired or bad token: drop it and bounce to the login screen.
  if (res.status === 401 && token) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    if (window.location.pathname !== "/login") window.location.href = "/login";
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data as T;
}
