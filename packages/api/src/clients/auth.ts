import { apiFetch, type ApiConfig } from '../http.js';
import type { AuthSession } from '../types/index.js';
import type { LoginInput } from '@moments/shared';

export function createAuthClient(config: Omit<ApiConfig, 'token'>) {
  return {
    login(input: LoginInput): Promise<AuthSession> {
      return apiFetch(
        { ...config, token: '' },
        '/auth/login',
        { method: 'POST', body: JSON.stringify(input) },
      );
    },

    logout(token: string): Promise<void> {
      return apiFetch({ ...config, token }, '/auth/logout', { method: 'POST' });
    },

    me(token: string): Promise<AuthSession> {
      return apiFetch({ ...config, token }, '/auth/me');
    },
  };
}
