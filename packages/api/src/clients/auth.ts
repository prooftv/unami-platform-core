import { apiFetch, type ApiConfig } from '../http';
import type { AuthSession } from '../types/index';
import type { LoginInput } from '@unami/shared';

export function createAuthClient(config: ApiConfig) {
  return {
    login(input: LoginInput): Promise<AuthSession> {
      return apiFetch(
        { ...config, token: '' },
        '/auth/login',
        { method: 'POST', body: JSON.stringify(input) },
      );
    },

    logout(): Promise<void> {
      return apiFetch(config, '/auth/logout', { method: 'POST' });
    },

    me(): Promise<AuthSession> {
      return apiFetch(config, '/auth');
    },
  };
}
