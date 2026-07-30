export { ApiError } from './http';
export type { ApiConfig } from './http';
export type * from './types/index';

import { createMomentsClient } from './clients/moments';
import { createBroadcastsClient } from './clients/broadcasts';
import { createAuthClient } from './clients/auth';

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
