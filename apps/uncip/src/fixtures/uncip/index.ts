// SYNTHETIC FIXTURE DATA — DEVELOPMENT ONLY
// Central export for all UNCIP synthetic fixtures.
// These fixtures are used during the UI phase only.
// They will be replaced by real data fetching in the backend phase.

export { FIXTURE_STATIONS } from './stations';
export { FIXTURE_SCHOOLS } from './schools';
export { FIXTURE_USERS } from './users';
export { FIXTURE_ALERTS } from './alerts';
export { FIXTURE_CHILDREN } from './children';

// ─── Lookup helpers ───────────────────────────────────────────────────────────
// Convenience functions for resolving cross-references in fixture data.
// These replace what would be JOIN queries in the backend phase.

import { FIXTURE_STATIONS } from './stations';
import { FIXTURE_SCHOOLS } from './schools';
import { FIXTURE_USERS } from './users';
import { FIXTURE_ALERTS } from './alerts';
import { FIXTURE_CHILDREN } from './children';

export function getStation(id: string) {
  return FIXTURE_STATIONS.find((s) => s.id === id) ?? null;
}

export function getSchool(id: string) {
  return FIXTURE_SCHOOLS.find((s) => s.id === id) ?? null;
}

export function getUser(id: string) {
  return FIXTURE_USERS.find((u) => u.id === id) ?? null;
}

export function getChild(id: string) {
  return FIXTURE_CHILDREN.find((c) => c.id === id) ?? null;
}

export function getAlert(id: string) {
  return FIXTURE_ALERTS.find((a) => a.id === id) ?? null;
}

export function getAlertsForChild(childId: string) {
  return FIXTURE_ALERTS.filter((a) => a.childId === childId);
}

export function getChildrenForSchool(schoolId: string) {
  return FIXTURE_CHILDREN.filter((c) => c.schoolId === schoolId);
}

export function getActiveAlerts() {
  return FIXTURE_ALERTS.filter((a) => a.status === 'active');
}
