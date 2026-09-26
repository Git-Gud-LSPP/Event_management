// src/services/authApi.ts
import { apiFetch } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "organizer" | "staff";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  role?: "organizer" | "staff";
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: AuthUser;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (credentials: RegisterCredentials) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  me: () => apiFetch<AuthUser>("/auth/me"),

  // Directory of people an organizer can add to an event.
  listUsers: (role?: "organizer" | "staff") =>
    apiFetch<{ items: AuthUser[] }>(`/auth/users${role ? `?role=${role}` : ""}`).then(
      (r) => r.items
    ),
};

// --- token/session helpers, so only one file knows the storage keys ---

export const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const isLoggedIn = () => Boolean(localStorage.getItem("authToken"));

export const saveSession = (token: string, user?: AuthUser) => {
  localStorage.setItem("authToken", token);
  if (user) localStorage.setItem("authUser", JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  window.location.href = "/login";
};
