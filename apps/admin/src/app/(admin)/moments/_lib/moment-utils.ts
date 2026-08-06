import type { AdminSession } from '@unami/api';
import { RECORD_ELIGIBLE_MOMENT_TYPES } from '@/domain/moments/enums';

export { RECORD_ELIGIBLE_MOMENT_TYPES };

// ── Badge variants ────────────────────────────────────────────────────────────

export const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  draft: 'outline',
  scheduled: 'secondary',
  broadcasted: 'default',
  cancelled: 'destructive',
};

export const BROADCAST_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending: 'outline',
  processing: 'secondary',
  completed: 'default',
  failed: 'destructive',
};

// ── URL builder ───────────────────────────────────────────────────────────────

export function buildMomentsUrl(overrides: {
  page?: number;
  status?: string;
  search?: string;
  currentPage: number;
  currentStatus: string;
  currentSearch: string;
}): string {
  const params = new URLSearchParams();
  const p = overrides.page ?? overrides.currentPage;
  const s = overrides.status !== undefined ? overrides.status : overrides.currentStatus;
  const q = overrides.search !== undefined ? overrides.search : overrides.currentSearch;
  if (p > 1) params.set('page', String(p));
  if (s && s !== 'all') params.set('status', s);
  if (q) params.set('search', q);
  const qs = params.toString();
  return `/moments${qs ? '?' + qs : ''}`;
}

// ── Role-based permissions ────────────────────────────────────────────────────

const EDITOR_ROLES = new Set(['superadmin', 'content_admin']);

export function canEditMoment(session: AdminSession, status: string): boolean {
  return EDITOR_ROLES.has(session.role) && (status === 'draft' || status === 'scheduled');
}

export function canBroadcastMoment(session: AdminSession, status: string): boolean {
  return EDITOR_ROLES.has(session.role) && (status === 'draft' || status === 'scheduled');
}

export function canCancelMoment(session: AdminSession, status: string): boolean {
  return EDITOR_ROLES.has(session.role) && (status === 'draft' || status === 'scheduled');
}

export function canCreateMoment(session: AdminSession): boolean {
  return EDITOR_ROLES.has(session.role);
}

// ── Urgency guide ─────────────────────────────────────────────────────────────

export const URGENCY_DESCRIPTIONS: Record<string, string> = {
  low: 'Routine community update',
  medium: 'Notable — elevated visibility',
  high: 'Important — prioritised delivery',
  urgent: 'Critical — immediate broadcast',
};

// ── File helpers ──────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
