import { createPublicApiClient } from '@moments/api';
import type { PublicApiClient } from '@moments/api';

export function getPublicApiClient(): PublicApiClient {
  return createPublicApiClient({
    baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1',
    token: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });
}
