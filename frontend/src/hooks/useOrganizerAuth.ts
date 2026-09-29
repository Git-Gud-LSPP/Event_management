// src/hooks/useOrganizerAuth.ts
import { useState } from 'react';
import { authApi } from '../services/authApi';

export function useOrganizerAuth(onSuccess?: (token: string) => void) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await authApi.login({ email, password });

      if (data.token) {
        localStorage.setItem('authToken', data.token);
        if (onSuccess) onSuccess(data.token);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setErrorMessage(null);

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    errorMessage,
    clearError,
    handleLogin,
  };
}