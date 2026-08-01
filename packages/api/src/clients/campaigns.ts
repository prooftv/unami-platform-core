import { apiFetch, type ApiConfig } from '../http';
import type { CampaignWithSponsor, PaginatedResponse } from '../types/index';
import type { CampaignStatus, Region, Category } from '@moments/shared';

export interface CampaignBudgetEntry {
  campaignId: string;
  title: string;
  sponsorName: string;
  budget: number;
  spent: number;
  broadcastsSent: number;
  status: CampaignStatus;
}

export interface BudgetTransaction {
  id: string;
  transactionType: 'spend' | 'refund' | 'adjustment';
  amount: number;
  recipientCount: number;
  costPerRecipient: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export interface CreateCampaignInput {
  title: string;
  content: string;
  category: Category;
  sponsorId?: string | null;
  budget?: number;
  targetRegions: Region[];
  targetCategories?: Category[];
  mediaUrls?: string[];
  scheduledAt?: string | null;
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>;

export function createCampaignsClient(config: ApiConfig) {
  return {
    list(params?: { page?: number; limit?: number; status?: CampaignStatus }): Promise<PaginatedResponse<CampaignWithSponsor>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/campaigns${qs}`);
    },

    get(id: string): Promise<CampaignWithSponsor> {
      return apiFetch(config, `/campaigns/${id}`);
    },

    budgetOverview(): Promise<CampaignBudgetEntry[]> {
      return apiFetch(config, '/campaigns/budget');
    },

    transactions(id: string): Promise<BudgetTransaction[]> {
      return apiFetch(config, `/campaigns/${id}/transactions`);
    },

    create(input: CreateCampaignInput): Promise<CampaignWithSponsor> {
      const body = {
        title: input.title,
        content: input.content,
        category: input.category,
        sponsor_id: input.sponsorId ?? null,
        budget: input.budget ?? 0,
        target_regions: input.targetRegions,
        target_categories: input.targetCategories ?? [],
        media_urls: input.mediaUrls ?? [],
        scheduled_at: input.scheduledAt ?? null,
      };
      return apiFetch(config, '/campaigns', { method: 'POST', body: JSON.stringify(body) });
    },

    update(id: string, input: UpdateCampaignInput): Promise<CampaignWithSponsor> {
      const body: Record<string, unknown> = {};
      if (input.title !== undefined) body.title = input.title;
      if (input.content !== undefined) body.content = input.content;
      if (input.category !== undefined) body.category = input.category;
      if (input.sponsorId !== undefined) body.sponsor_id = input.sponsorId;
      if (input.budget !== undefined) body.budget = input.budget;
      if (input.targetRegions !== undefined) body.target_regions = input.targetRegions;
      if (input.targetCategories !== undefined) body.target_categories = input.targetCategories;
      if (input.mediaUrls !== undefined) body.media_urls = input.mediaUrls;
      if (input.scheduledAt !== undefined) body.scheduled_at = input.scheduledAt;
      return apiFetch(config, `/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    },

    approve(id: string): Promise<CampaignWithSponsor> {
      return apiFetch(config, `/campaigns/${id}/approve`, { method: 'POST' });
    },

    pause(id: string): Promise<CampaignWithSponsor> {
      return apiFetch(config, `/campaigns/${id}/pause`, { method: 'POST' });
    },

    cancel(id: string): Promise<CampaignWithSponsor> {
      return apiFetch(config, `/campaigns/${id}/cancel`, { method: 'POST' });
    },
  };
}
