/**
 * Server-only. Returns the current UNCIP session.
 *
 * FOUNDATION PHASE: Returns a mock session.
 * AUTH PHASE: Replace the body of this function with Supabase Auth validation
 * + Edge Function role lookup. The return type (UNCIPSession | null) does not change.
 */

import type { UNCIPSession } from '@/domain/uncip';
import { DEFAULT_MOCK_SESSION } from './mock-session';

export type { UNCIPSession };

export async function getUNCIPSession(): Promise<UNCIPSession | null> {
  // TODO(auth-phase): Replace with Supabase Auth getUser() + /uncip-auth Edge Function
  return DEFAULT_MOCK_SESSION;
}
