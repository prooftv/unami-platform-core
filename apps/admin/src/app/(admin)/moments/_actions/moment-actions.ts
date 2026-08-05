'use server';

import { revalidatePath } from 'next/cache';
import { getApiClient } from '@/lib/api/client';
import type { Region, Category, UrgencyLevel, MomentType } from '@/domain/moments';

// ── Create ────────────────────────────────────────────────────────────────────

export async function createMomentAction(payload: {
  title: string;
  content: string;
  region: Region;
  category: Category;
  language: string;
  urgencyLevel: UrgencyLevel;
  momentType: MomentType;
  participationEnabled: boolean;
  participationDeadline: string | null;
  publishToPwa: boolean;
  publishToWhatsapp: boolean;
  isSponsored: boolean;
  sponsorId: string | null;
  pwaLink: string | null;
  scheduledAt: string | null;
}): Promise<{ error?: string }> {
  const api = await getApiClient();
  if (!api) return { error: 'Not authenticated' };
  try {
    await api.moments.create({ ...payload, mediaUrls: [] });
    revalidatePath('/moments');
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create moment' };
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateMomentAction(id: string, payload: {
  title: string;
  content: string;
  region: Region;
  category: Category;
  language: string;
  urgencyLevel: UrgencyLevel;
  publishToPwa: boolean;
  publishToWhatsapp: boolean;
  isSponsored: boolean;
  sponsorId: string | null;
  pwaLink: string | null;
}): Promise<{ error?: string }> {
  const api = await getApiClient();
  if (!api) return { error: 'Not authenticated' };
  try {
    await api.moments.update(id, payload);
    revalidatePath(`/moments/${id}`);
    revalidatePath('/moments');
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save moment' };
  }
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export async function scheduleMomentAction(id: string, scheduledAt: string): Promise<{ error?: string }> {
  const api = await getApiClient();
  if (!api) return { error: 'Not authenticated' };
  try {
    await api.moments.schedule(id, { scheduledAt });
    revalidatePath(`/moments/${id}`);
    revalidatePath('/moments');
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to schedule moment' };
  }
}

// ── Cancel ────────────────────────────────────────────────────────────────────

export async function cancelMomentAction(id: string): Promise<{ error?: string }> {
  const api = await getApiClient();
  if (!api) return { error: 'Not authenticated' };
  try {
    await api.moments.cancel(id);
    revalidatePath(`/moments/${id}`);
    revalidatePath('/moments');
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to cancel moment' };
  }
}

// ── Broadcast ─────────────────────────────────────────────────────────────────

export async function broadcastMomentAction(id: string): Promise<{ successCount?: number; recipientCount?: number; error?: string }> {
  const api = await getApiClient();
  if (!api) return { error: 'Not authenticated' };
  try {
    const res = await api.broadcasts.trigger(id);
    revalidatePath(`/moments/${id}`);
    revalidatePath('/moments');
    return { successCount: res.successCount, recipientCount: res.recipientCount };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Broadcast failed' };
  }
}

// ── Bulk cancel ───────────────────────────────────────────────────────────────

export async function bulkCancelMomentsAction(ids: string[]): Promise<{ cancelled: number; failed: number }> {
  const api = await getApiClient();
  if (!api) return { cancelled: 0, failed: ids.length };
  const results = await Promise.allSettled(ids.map((id) => api.moments.cancel(id)));
  const failed = results.filter((r) => r.status === 'rejected').length;
  revalidatePath('/moments');
  return { cancelled: ids.length - failed, failed };
}

// ── Upload evidence ───────────────────────────────────────────────────────────

export async function uploadEvidenceAction(momentId: string, formData: FormData): Promise<{ error?: string; id?: string }> {
  const api = await getApiClient();
  if (!api) return { error: 'Not authenticated' };
  const title = formData.get('title') as string;
  const file = formData.get('file') as File;
  if (!title?.trim() || !file?.size) return { error: 'Title and file are required' };
  try {
    const record = await api.evidence.upload({ momentId, title: title.trim(), file });
    revalidatePath(`/moments/${momentId}`);
    return { id: record.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' };
  }
}
