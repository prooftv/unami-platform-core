import type { Moment, AuthorityProfile, Subscription } from '../types/index.js';
import { MomentStatus, UrgencyLevel, AuthorityLevel } from '../enums/index.js';
import { BLAST_RADIUS_BY_LEVEL, MCP, LIMITS, PROHIBITED_TERMS } from '../constants/index.js';

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

/** Normalise a phone number to E.164 format. Returns null if invalid. */
export function formatPhoneNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return `+27${digits.slice(1)}`;
  }
  if (digits.startsWith('27') && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.startsWith('27') && digits.length === 12) {
    return `+${digits}`;
  }
  return raw.startsWith('+') ? raw : null;
}

/** Mask a phone number for display: +27...1234 */
export function maskPhoneNumber(phone: string): string {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 3)}...${phone.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Region
// ---------------------------------------------------------------------------

/** Normalise a region string to its canonical enum value. */
export function normaliseRegion(input: string): string {
  const upper = input.trim().toUpperCase();
  const map: Record<string, string> = {
    'KWAZULU-NATAL': 'KZN',
    'KWAZULU NATAL': 'KZN',
    'WESTERN CAPE': 'WC',
    'GAUTENG': 'GP',
    'EASTERN CAPE': 'EC',
    'FREE STATE': 'FS',
    'LIMPOPO': 'LP',
    'MPUMALANGA': 'MP',
    'NORTHERN CAPE': 'NC',
    'NORTH WEST': 'NW',
    'NATIONAL': 'National',
  };
  return map[upper] ?? input.trim();
}

// ---------------------------------------------------------------------------
// Moment
// ---------------------------------------------------------------------------

/** A moment can only be broadcast if it is in draft or scheduled status. */
export function isBroadcastable(moment: Pick<Moment, 'status'>): boolean {
  return moment.status === MomentStatus.DRAFT || moment.status === MomentStatus.SCHEDULED;
}

/** A moment can only be edited if it has not been broadcast. */
export function isEditable(moment: Pick<Moment, 'status'>): boolean {
  return moment.status !== MomentStatus.BROADCASTED && moment.status !== MomentStatus.CANCELLED;
}

/** Returns true if the moment requires priority processing. */
export function isUrgent(moment: Pick<Moment, 'urgencyLevel'>): boolean {
  return moment.urgencyLevel === UrgencyLevel.URGENT || moment.urgencyLevel === UrgencyLevel.HIGH;
}

/** Format moment content for WhatsApp — preserves newlines, appends opt-out footer. */
export function formatMomentForWhatsApp(
  moment: Pick<Moment, 'title' | 'content'>,
  sponsorName?: string,
): string {
  const lines: string[] = [`*${moment.title}*`, '', moment.content];
  if (sponsorName) {
    lines.push('', `_In partnership with ${sponsorName}_`);
  }
  lines.push('', 'Reply STOP to unsubscribe');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Authority
// ---------------------------------------------------------------------------

/** Get the default blast radius for an authority level. */
export function getBlastRadius(level: AuthorityLevel): number {
  return BLAST_RADIUS_BY_LEVEL[level] ?? LIMITS.BLAST_RADIUS_DEFAULT;
}

/** Get the MCP risk threshold for an authority profile, falling back to default. */
export function getRiskThreshold(profile: Pick<AuthorityProfile, 'riskThreshold'> | null): number {
  return profile?.riskThreshold ?? MCP.RISK_THRESHOLD_DEFAULT;
}

/** Fail-open authority lookup — returns null on any error. */
export function failOpen<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// MCP / Moderation
// ---------------------------------------------------------------------------

/** Returns true if the MCP confidence score indicates high risk. */
export function isHighRisk(confidence: number): boolean {
  return confidence >= MCP.ESCALATION_THRESHOLD;
}

/** Returns true if the content should be auto-approved. */
export function shouldAutoApprove(confidence: number, riskThreshold: number): boolean {
  return confidence < riskThreshold;
}

/** Format a confidence score as a percentage string. */
export function formatConfidenceScore(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

/** Returns true if a subscriber should receive a broadcast for the given region. */
export function subscriberMatchesRegion(
  subscription: Pick<Subscription, 'regions'>,
  momentRegion: string,
): boolean {
  const regions = subscription.regions as string[];
  return regions.includes('National') || regions.includes(momentRegion);
}

/** Returns true if a subscriber's pause period has expired. */
export function isPauseExpired(pausedUntil: string | null): boolean {
  if (!pausedUntil) return true;
  return new Date(pausedUntil) <= new Date();
}

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------

/** Check content for prohibited terms. Returns matched terms. */
export function findProhibitedTerms(content: string): string[] {
  const lower = content.toLowerCase();
  return PROHIBITED_TERMS.filter((term) => lower.includes(term));
}

/** Calculate a simple compliance risk score (0–100). */
export function calculateRiskScore(content: string): number {
  const matches = findProhibitedTerms(content);
  return Math.min(matches.length * 20, 100);
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

/** Estimate the cost of a broadcast in ZAR. */
export function estimateBroadcastCost(recipientCount: number, messageCostZar: number): number {
  return recipientCount * messageCostZar;
}

/** Returns true if a broadcast would exceed the remaining budget. */
export function wouldExceedBudget(
  recipientCount: number,
  messageCostZar: number,
  remainingBudget: number,
): boolean {
  return estimateBroadcastCost(recipientCount, messageCostZar) > remainingBudget;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Format a ZAR currency value. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
}

/** Format a percentage from a decimal (0.955 → "95.5%"). */
export function formatPercentage(decimal: number): string {
  return `${(decimal * 100).toFixed(1)}%`;
}
