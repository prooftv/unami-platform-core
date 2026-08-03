import { createPublicApiClient } from '@unami/api';
import type { PublicApiClient } from '@unami/api';

export function getPublicApiClient(): PublicApiClient {
  return createPublicApiClient({
    baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1',
    token: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });
}
