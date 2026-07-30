import { apiFetch, type ApiConfig } from '../http';
import type { Campaign, CampaignWithSponsor, PaginatedResponse } from '../types/index';
import type { CampaignStatus } from '@moments/shared';

export interface CampaignBudgetEntry {
  campaignId: string;
  title: string;
  sponsorName: string;
  budget: number;
  spent: number;
  broadcastsSent: number;
  status: CampaignStatus;
}

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
  };
}
