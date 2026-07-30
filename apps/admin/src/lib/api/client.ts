import { createClient } from '@/lib/supabase/server';
import { createApiClient } from '@moments/api';
import type { ApiClient } from '@moments/api';

export async function getApiClient(): Promise<ApiClient | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1',
    token: session.access_token,
  });
}
