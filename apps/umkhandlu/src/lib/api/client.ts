import { createGovernanceNodeClient } from '@unami/api';
import type { GovernanceNodeClient } from '@unami/api';

// Returns a typed read-only client for a governance node.
// baseUrl and apiKey come from env — one entry per registered node.
export function getNodeClient(baseUrl: string, apiKey: string): GovernanceNodeClient {
  return createGovernanceNodeClient({ baseUrl, token: apiKey });
}
