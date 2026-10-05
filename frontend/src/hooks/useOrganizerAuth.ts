// src/hooks/useOrganizerAuth.ts
import { useState } from 'react';
import { authApi, saveSession, type AuthUser } from '../services/authApi';

export type AuthMode = 'login' | 'register';

export function useOrganizerAuth(onSuccess?: (token: string, user?: AuthUser) => void) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'organizer' | 'staff'>('organizer');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data =
        mode === 'register'
          ? await authApi.register({ name, email, password, role })
          : await authApi.login({ email, password });

      if (data.token) {
        saveSession(data.token, data.user);
        if (onSuccess) onSuccess(data.token, data.user);
      } else {
        setErrorMessage('No token returned by the server.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setErrorMessage(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrorMessage(null);
  };

  return {
    mode,
    switchMode,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    role,
    setRole,
    isLoading,
    errorMessage,
    clearError,
    handleLogin,
  };
}
