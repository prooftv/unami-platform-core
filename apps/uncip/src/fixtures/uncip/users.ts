// SYNTHETIC FIXTURE DATA — DEVELOPMENT ONLY
// These records do not represent real people.
// All names, emails, and identifiers are fictional.

import type { UserRecord } from '@/domain/uncip';

export const FIXTURE_USERS: UserRecord[] = [
  // Admin — Unami Foundation operator, no station scope
  {
    id: 'user-admin-001',
    email: 'admin@demo.uncip.dev',
    name: 'Thabo Mokoena',
    role: 'admin',
    stationId: null,
    schoolId: null,
    isActive: true,
    createdAt: '2025-01-10T08:00:00Z',
  },

  // Parents — station scope unresolved, set to null per constitution
  {
    id: 'user-parent-001',
    email: 'parent1@demo.uncip.dev',
    name: 'Nomvula Dlamini',
    role: 'parent',
    stationId: null,
    schoolId: null,
    isActive: true,
    createdAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'user-parent-002',
    email: 'parent2@demo.uncip.dev',
    name: 'Siphamandla Nkosi',
    role: 'parent',
    stationId: null,
    schoolId: null,
    isActive: true,
    createdAt: '2025-01-18T10:00:00Z',
  },
  {
    id: 'user-parent-003',
    email: 'parent3@demo.uncip.dev',
    name: 'Zanele Khumalo',
    role: 'parent',
    stationId: null,
    schoolId: null,
    isActive: true,
    createdAt: '2025-02-01T11:00:00Z',
  },

  // School staff — scoped to a school
  {
    id: 'user-school-001',
    email: 'school1@demo.uncip.dev',
    name: 'Lindiwe Mthembu',
    role: 'school',
    stationId: null,
    schoolId: 'school-001',
    isActive: true,
    createdAt: '2025-01-12T08:30:00Z',
  },
  {
    id: 'user-school-002',
    email: 'school2@demo.uncip.dev',
    name: 'Bongani Zulu',
    role: 'school',
    stationId: null,
    schoolId: 'school-003',
    isActive: true,
    createdAt: '2025-01-14T09:00:00Z',
  },

  // Authority — scoped to a station
  {
    id: 'user-authority-001',
    email: 'authority1@demo.uncip.dev',
    name: 'Warrant Officer Petrus van Wyk',
    role: 'authority',
    stationId: 'station-001',
    schoolId: null,
    isActive: true,
    createdAt: '2025-01-11T07:00:00Z',
  },
  {
    id: 'user-authority-002',
    email: 'authority2@demo.uncip.dev',
    name: 'Sergeant Nokukhanya Cele',
    role: 'authority',
    stationId: 'station-002',
    schoolId: null,
    isActive: true,
    createdAt: '2025-01-13T07:30:00Z',
  },

  // Community — scoped to a station
  {
    id: 'user-community-001',
    email: 'community1@demo.uncip.dev',
    name: 'Mama Ntombi Shabalala',
    role: 'community',
    stationId: 'station-001',
    schoolId: null,
    isActive: true,
    createdAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 'user-community-002',
    email: 'community2@demo.uncip.dev',
    name: 'Mzwandile Hadebe',
    role: 'community',
    stationId: 'station-002',
    schoolId: null,
    isActive: true,
    createdAt: '2025-01-22T11:00:00Z',
  },
];
