export { ApiError } from './http.js';
export type { ApiConfig } from './http.js';
export type * from './types/index.js';

import { createMomentsClient } from './clients/moments.js';
import { createBroadcastsClient } from './clients/broadcasts.js';
import { createAuthClient } from './clients/auth.js';

export interface ApiClientConfig {
  baseUrl: string;
  token: string;
}

export function createApiClient(config: ApiClientConfig) {
  return {
    moments:    createMomentsClient(config),
    broadcasts: createBroadcastsClient(config),
    auth:       createAuthClient(config),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
