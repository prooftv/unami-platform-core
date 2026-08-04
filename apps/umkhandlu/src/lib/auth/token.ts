'use client';

import { createClient } from '@/lib/supabase/client';

export async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}
