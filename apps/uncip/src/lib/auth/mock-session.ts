/**
 * MOCK SESSION PROVIDER — FOUNDATION PHASE ONLY
 *
 * This module provides a synthetic UNCIPSession for UI development.
 * It is NOT production authentication.
 * It does NOT connect to Supabase Auth.
 * It does NOT represent a real user.
 *
 * Replace this entire module with the real Supabase Auth implementation
 * when the UNCIP auth phase begins.
 *
 * The mock session uses synthetic identity only — no real names, emails,
 * IDs, or credentials from any source.
 */

import type { UNCIPSession, UNCIPRole } from '@/domain/uncip';

// Synthetic sessions for each role — used during UI development only.
// These are not real users. They do not exist in any database.
const MOCK_SESSIONS: Record<UNCIPRole, UNCIPSession> = {
  admin: {
    id: 'mock-admin-00000000',
    email: 'admin@mock.uncip.dev',
    name: 'Demo Admin',
    role: 'admin',
    stationId: null,
    schoolId: null,
  },
  parent: {
    id: 'mock-parent-00000000',
    email: 'parent@mock.uncip.dev',
    name: 'Demo Parent',
    role: 'parent',
    stationId: 'mock-station-001',
    schoolId: null,
  },
  school: {
    id: 'mock-school-00000000',
    email: 'school@mock.uncip.dev',
    name: 'Demo School Staff',
    role: 'school',
    stationId: 'mock-station-001',
    schoolId: 'mock-school-001',
  },
  authority: {
    id: 'mock-authority-00000000',
    email: 'authority@mock.uncip.dev',
    name: 'Demo Authority',
    role: 'authority',
    stationId: 'mock-station-001',
    schoolId: null,
  },
  community: {
    id: 'mock-community-00000000',
    email: 'community@mock.uncip.dev',
    name: 'Demo Community Member',
    role: 'community',
    stationId: 'mock-station-001',
    schoolId: null,
  },
};

/**
 * Returns a synthetic UNCIPSession for the given role.
 * Used only during the foundation/UI phase.
 * Never call this in production code.
 */
export function getMockSession(role: UNCIPRole = 'admin'): UNCIPSession {
  return MOCK_SESSIONS[role];
}

/**
 * The default mock session used by the shell during foundation phase.
 * Role is 'admin' so all navigation is visible for UI development.
 */
export const DEFAULT_MOCK_SESSION: UNCIPSession = MOCK_SESSIONS.admin;
