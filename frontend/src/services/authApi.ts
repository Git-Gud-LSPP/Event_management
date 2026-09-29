// src/services/authApi.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Authentication failed');
    }

    return data;
  },
};