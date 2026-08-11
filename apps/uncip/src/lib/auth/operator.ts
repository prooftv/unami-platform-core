/**
 * Server-only. Returns the current UNCIP session.
 *
 * FOUNDATION PHASE: Returns a mock session.
 * AUTH PHASE: Replace the body of this function with Supabase Auth validation
 * + Edge Function role lookup. The return type (UNCIPSession | null) does not change.
 */

import { cookies } from 'next/headers';
import type { UNCIPSession, UNCIPRole } from '@/domain/uncip';
import { getMockSession } from './mock-session';

export type { UNCIPSession };

const VALID_ROLES: UNCIPRole[] = ['admin', 'parent', 'school', 'authority', 'community'];

export async function getUNCIPSession(): Promise<UNCIPSession | null> {
  // TODO(auth-phase): Replace with Supabase Auth getUser() + /uncip-auth Edge Function
  const cookieStore = await cookies();
  const raw = cookieStore.get('mock_role')?.value as UNCIPRole | undefined;
  const role: UNCIPRole = raw && VALID_ROLES.includes(raw) ? raw : 'admin';
  return getMockSession(role);
}
