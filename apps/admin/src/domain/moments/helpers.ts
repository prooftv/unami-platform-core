import type { Moment, AuthorityProfile, Subscription } from './types';
import { MomentStatus, UrgencyLevel, AuthorityLevel } from './enums';
import { BLAST_RADIUS_BY_LEVEL, MCP, LIMITS, PROHIBITED_TERMS } from './constants';

// ---------------------------------------------------------------------------
// Moment
// ---------------------------------------------------------------------------

export function isBroadcastable(moment: Pick<Moment, 'status'>): boolean {
  return moment.status === MomentStatus.DRAFT || moment.status === MomentStatus.SCHEDULED;
}

export function isEditable(moment: Pick<Moment, 'status'>): boolean {
  return moment.status !== MomentStatus.BROADCASTED && moment.status !== MomentStatus.CANCELLED;
}

export function isUrgent(moment: Pick<Moment, 'urgencyLevel'>): boolean {
  return moment.urgencyLevel === UrgencyLevel.URGENT || moment.urgencyLevel === UrgencyLevel.HIGH;
}

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

export function getBlastRadius(level: AuthorityLevel): number {
  return BLAST_RADIUS_BY_LEVEL[level] ?? LIMITS.BLAST_RADIUS_DEFAULT;
}

export function getRiskThreshold(profile: Pick<AuthorityProfile, 'riskThreshold'> | null): number {
  return profile?.riskThreshold ?? MCP.RISK_THRESHOLD_DEFAULT;
}

// ---------------------------------------------------------------------------
// MCP / Moderation
// ---------------------------------------------------------------------------

export function isHighRisk(confidence: number): boolean {
  return confidence >= MCP.ESCALATION_THRESHOLD;
}

export function shouldAutoApprove(confidence: number, riskThreshold: number): boolean {
  return confidence < riskThreshold;
}

export function formatConfidenceScore(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export function subscriberMatchesRegion(
  subscription: Pick<Subscription, 'regions'>,
  momentRegion: string,
): boolean {
  const regions = subscription.regions as string[];
  return regions.includes('National') || regions.includes(momentRegion);
}

export function isPauseExpired(pausedUntil: string | null): boolean {
  if (!pausedUntil) return true;
  return new Date(pausedUntil) <= new Date();
}

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------

export function findProhibitedTerms(content: string): string[] {
  const lower = content.toLowerCase();
  return PROHIBITED_TERMS.filter((term) => lower.includes(term));
}

export function calculateRiskScore(content: string): number {
  const matches = findProhibitedTerms(content);
  return Math.min(matches.length * 20, 100);
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export function estimateBroadcastCost(recipientCount: number, messageCostZar: number): number {
  return recipientCount * messageCostZar;
}

export function wouldExceedBudget(
  recipientCount: number,
  messageCostZar: number,
  remainingBudget: number,
): boolean {
  return estimateBroadcastCost(recipientCount, messageCostZar) > remainingBudget;
}
