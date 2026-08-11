// SYNTHETIC FIXTURE DATA — DEVELOPMENT ONLY
// These records do not represent real children.
// All names, dates, addresses, and identification numbers are fictional.
// No real child data is present in this file.

import type { ChildRecord } from '@/domain/uncip';

export const FIXTURE_CHILDREN: ChildRecord[] = [
  // ── child-001: Amahle Dlamini — has resolved alert (alert-001) ───────────────
  {
    id: 'child-001',
    firstName: 'Amahle',
    lastName: 'Dlamini',
    dateOfBirth: '2015-03-12',
    gender: 'male',
    photoUrl: null,
    identificationNumber: null,
    schoolId: 'school-001',
    address: {
      street: '14 Mew Way',
      city: 'Khayelitsha',
      province: 'western_cape',
      postalCode: null,
    },
    medicalInfo: {
      bloodType: 'O+',
      allergies: [],
      conditions: [],
      medications: [],
      emergencyContactName: 'Nomvula Dlamini',
      emergencyContactRelationship: 'Mother',
      emergencyContactPhone: '071-000-0001',
    },
    guardians: [
      {
        id: 'gl-001-1',
        childId: 'child-001',
        userId: 'user-parent-001',
        relationship: 'parent',
        isPrimary: true,
      },
    ],
    createdAt: '2025-01-15T09:30:00Z',
    updatedAt: '2025-03-10T19:45:00Z',
  },

  // ── child-002: Ayanda Dlamini — has cancelled alert (alert-004) ──────────────
  {
    id: 'child-002',
    firstName: 'Ayanda',
    lastName: 'Dlamini',
    dateOfBirth: '2017-08-25',
    gender: 'female',
    photoUrl: null,
    identificationNumber: null,
    schoolId: 'school-002',
    address: {
      street: '14 Mew Way',
      city: 'Khayelitsha',
      province: 'western_cape',
      postalCode: null,
    },
    medicalInfo: null,
    guardians: [
      {
        id: 'gl-002-1',
        childId: 'child-002',
        userId: 'user-parent-001',
        relationship: 'parent',
        isPrimary: true,
      },
    ],
    createdAt: '2025-01-15T09:35:00Z',
    updatedAt: '2025-06-20T17:30:00Z',
  },

  // ── child-003: Siyanda Nkosi — has active missing alert (alert-002) ──────────
  {
    id: 'child-003',
    firstName: 'Siyanda',
    lastName: 'Nkosi',
    dateOfBirth: '2014-11-03',
    gender: 'female',
    photoUrl: null,
    identificationNumber: null,
    schoolId: 'school-003',
    address: {
      street: '7 Molapo Street',
      city: 'Soweto',
      province: 'gauteng',
      postalCode: null,
    },
    medicalInfo: {
      bloodType: null,
      allergies: ['Penicillin'],
      conditions: [],
      medications: [],
      emergencyContactName: 'Siphamandla Nkosi',
      emergencyContactRelationship: 'Father',
      emergencyContactPhone: '072-000-0002',
    },
    guardians: [
      {
        id: 'gl-003-1',
        childId: 'child-003',
        userId: 'user-parent-002',
        relationship: 'parent',
        isPrimary: true,
      },
    ],
    createdAt: '2025-01-18T10:30:00Z',
    updatedAt: '2025-07-15T10:00:00Z',
  },

  // ── child-004: Sipho Mthembu — has resolved medical alert (alert-008) ─────────
  {
    id: 'child-004',
    firstName: 'Sipho',
    lastName: 'Mthembu',
    dateOfBirth: '2016-05-19',
    gender: 'male',
    photoUrl: null,
    identificationNumber: null,
    schoolId: 'school-001',
    address: {
      street: '3 Steve Biko Drive',
      city: 'Khayelitsha',
      province: 'western_cape',
      postalCode: null,
    },
    medicalInfo: {
      bloodType: 'A+',
      allergies: [],
      conditions: ['Epilepsy'],
      medications: ['Sodium valproate'],
      emergencyContactName: 'Lindiwe Mthembu',
      emergencyContactRelationship: 'Mother',
      emergencyContactPhone: '078-000-0008',
    },
    guardians: [
      {
        id: 'gl-004-1',
        childId: 'child-004',
        userId: 'user-parent-001',
        relationship: 'parent',
        isPrimary: false,
      },
      {
        id: 'gl-004-2',
        childId: 'child-004',
        userId: 'user-parent-003',
        relationship: 'grandparent',
        isPrimary: true,
      },
    ],
    createdAt: '2025-02-01T11:00:00Z',
    updatedAt: '2025-04-22T13:00:00Z',
  },

  // ── child-005: Lebo Zulu — has active medical alert (alert-003) ───────────────
  {
    id: 'child-005',
    firstName: 'Lebo',
    lastName: 'Zulu',
    dateOfBirth: '2015-09-07',
    gender: 'male',
    photoUrl: null,
    identificationNumber: null,
    schoolId: 'school-003',
    address: {
      street: '22 Vilakazi Street',
      city: 'Soweto',
      province: 'gauteng',
      postalCode: null,
    },
    medicalInfo: {
      bloodType: 'B+',
      allergies: ['Peanuts', 'Tree nuts'],
      conditions: ['Severe nut allergy'],
      medications: ['EpiPen'],
      emergencyContactName: 'Bongani Zulu',
      emergencyContactRelationship: 'Father',
      emergencyContactPhone: '073-000-0003',
    },
    guardians: [
      {
        id: 'gl-005-1',
        childId: 'child-005',
        userId: 'user-parent-002',
        relationship: 'parent',
        isPrimary: true,
      },
    ],
    createdAt: '2025-01-20T12:00:00Z',
    updatedAt: '2025-07-14T11:50:00Z',
  },

  // ── child-006: Nokwanda Khumalo — no alerts, complete profile ─────────────────
  {
    id: 'child-006',
    firstName: 'Nokwanda',
    lastName: 'Khumalo',
    dateOfBirth: '2016-02-14',
    gender: 'female',
    photoUrl: null,
    identificationNumber: null,
    schoolId: 'school-001',
    address: {
      street: '8 Spine Road',
      city: 'Khayelitsha',
      province: 'western_cape',
      postalCode: null,
    },
    medicalInfo: null,
    guardians: [
      {
        id: 'gl-006-1',
        childId: 'child-006',
        userId: 'user-parent-003',
        relationship: 'parent',
        isPrimary: true,
      },
    ],
    createdAt: '2025-02-05T09:00:00Z',
    updatedAt: '2025-02-05T09:00:00Z',
  },

  // ── child-007: Thabo Shabalala — has false alarm alert (alert-005) ────────────
  {
    id: 'child-007',
    firstName: 'Thabo',
    lastName: 'Shabalala',
    dateOfBirth: '2014-07-30',
    gender: 'male',
    photoUrl: null,
    identificationNumber: null,
    schoolId: 'school-004',
    address: {
      street: '5 Section K',
      city: 'Umlazi',
      province: 'kwazulu_natal',
      postalCode: null,
    },
    medicalInfo: null,
    guardians: [
      {
        id: 'gl-007-1',
        childId: 'child-007',
        userId: 'user-parent-003',
        relationship: 'parent',
        isPrimary: true,
      },
    ],
    createdAt: '2025-02-10T10:00:00Z',
    updatedAt: '2025-05-05T14:00:00Z',
  },

  // ── child-008: Nandi Cele — no alerts, minimal profile ───────────────────────
  {
    id: 'child-008',
    firstName: 'Nandi',
    lastName: 'Cele',
    dateOfBirth: '2017-12-01',
    gender: 'female',
    photoUrl: null,
    identificationNumber: null,
    schoolId: 'school-002',
    address: null,
    medicalInfo: null,
    guardians: [
      {
        id: 'gl-008-1',
        childId: 'child-008',
        userId: 'user-parent-001',
        relationship: 'parent',
        isPrimary: true,
      },
    ],
    createdAt: '2025-03-01T08:00:00Z',
    updatedAt: '2025-03-01T08:00:00Z',
  },

  // ── child-009: Zintle Khumalo — has active danger alert (alert-006) ───────────
  {
    id: 'child-009',
    firstName: 'Zintle',
    lastName: 'Khumalo',
    dateOfBirth: '2013-04-18',
    gender: 'female',
    photoUrl: null,
    identificationNumber: null,
    schoolId: 'school-001',
    address: {
      street: '31 Mew Way',
      city: 'Khayelitsha',
      province: 'western_cape',
      postalCode: null,
    },
    medicalInfo: null,
    guardians: [
      {
        id: 'gl-009-1',
        childId: 'child-009',
        userId: 'user-parent-003',
        relationship: 'parent',
        isPrimary: true,
      },
    ],
    createdAt: '2025-03-10T09:00:00Z',
    updatedAt: '2025-07-16T17:00:00Z',
  },

  // ── child-010: Mpho Mokoena — no alerts, two guardians ───────────────────────
  {
    id: 'child-010',
    firstName: 'Mpho',
    lastName: 'Mokoena',
    dateOfBirth: '2015-06-22',
    gender: 'other',
    photoUrl: null,
    identificationNumber: null,
    schoolId: 'school-003',
    address: {
      street: '15 Klipspruit Valley Road',
      city: 'Soweto',
      province: 'gauteng',
      postalCode: null,
    },
    medicalInfo: null,
    guardians: [
      {
        id: 'gl-010-1',
        childId: 'child-010',
        userId: 'user-parent-002',
        relationship: 'parent',
        isPrimary: true,
      },
      {
        id: 'gl-010-2',
        childId: 'child-010',
        userId: 'user-parent-003',
        relationship: 'foster_carer',
        isPrimary: false,
      },
    ],
    createdAt: '2025-03-15T10:00:00Z',
    updatedAt: '2025-03-15T10:00:00Z',
  },

  // ── child-011: Lethiwe Nkosi — has active other alert (alert-007) ─────────────
  {
    id: 'child-011',
    firstName: 'Lethiwe',
    lastName: 'Nkosi',
    dateOfBirth: '2014-01-09',
    gender: 'female',
    photoUrl: null,
    identificationNumber: null,
    schoolId: 'school-004',
    address: {
      street: '2 Section K',
      city: 'Umlazi',
      province: 'kwazulu_natal',
      postalCode: null,
    },
    medicalInfo: null,
    guardians: [
      {
        id: 'gl-011-1',
        childId: 'child-011',
        userId: 'user-parent-002',
        relationship: 'parent',
        isPrimary: true,
      },
    ],
    createdAt: '2025-04-01T09:00:00Z',
    updatedAt: '2025-07-16T09:00:00Z',
  },

  // ── child-012: Kagiso van Wyk — no alerts, no school yet ─────────────────────
  {
    id: 'child-012',
    firstName: 'Kagiso',
    lastName: 'van Wyk',
    dateOfBirth: '2019-10-05',
    gender: 'male',
    photoUrl: null,
    identificationNumber: null,
    schoolId: null,
    address: {
      street: '9 Spine Road',
      city: 'Khayelitsha',
      province: 'western_cape',
      postalCode: null,
    },
    medicalInfo: {
      bloodType: null,
      allergies: ['Dairy'],
      conditions: [],
      medications: [],
      emergencyContactName: 'Zanele Khumalo',
      emergencyContactRelationship: 'Mother',
      emergencyContactPhone: '074-000-0012',
    },
    guardians: [
      {
        id: 'gl-012-1',
        childId: 'child-012',
        userId: 'user-parent-003',
        relationship: 'parent',
        isPrimary: true,
      },
    ],
    createdAt: '2025-05-01T10:00:00Z',
    updatedAt: '2025-05-01T10:00:00Z',
  },
];
