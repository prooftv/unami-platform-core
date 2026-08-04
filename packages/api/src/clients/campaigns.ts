import { apiFetch, type ApiConfig } from '../http';
import type { CampaignWithSponsor, PaginatedResponse, CertifiedDeliverable, ProgressLogEntry } from '../types/index';
import type { CampaignStatus, CampaignType, ProjectHealth, ProjectPhase, Region, Category } from '../types/index';

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
  campaignType?: CampaignType;
  projectReference?: string | null;
  fundingSource?: string | null;
  contractor?: string | null;
  beneficiaries?: number | null;
}

export type UpdateCampaignInput = Partial<CreateCampaignInput> & {
  projectHealth?: ProjectHealth | null;
  projectPhase?: ProjectPhase | null;
  impactSummary?: string | null;
  lessonsLearned?: string | null;
};

export interface AddProgressInput {
  update: string;
  date?: string;
}

export interface CertifyDeliverableInput {
  task: string;
  certifiedBy: string;
  percentageComplete: number;
  weightage?: number;
  notes?: string;
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

    transactions(id: string): Promise<BudgetTransaction[]> {
      return apiFetch(config, `/campaigns/${id}/transactions`);
    },

    progressLog(id: string): Promise<ProgressLogEntry[]> {
      return apiFetch(config, `/campaigns/${id}/progress`);
    },

    deliverables(id: string): Promise<CertifiedDeliverable[]> {
      return apiFetch(config, `/campaigns/${id}/deliverables`);
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
        campaign_type: input.campaignType ?? 'ad',
        project_reference: input.projectReference ?? null,
        funding_source: input.fundingSource ?? null,
        contractor: input.contractor ?? null,
        beneficiaries: input.beneficiaries ?? null,
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
      if (input.campaignType !== undefined) body.campaign_type = input.campaignType;
      if (input.projectHealth !== undefined) body.project_health = input.projectHealth;
      if (input.projectPhase !== undefined) body.project_phase = input.projectPhase;
      if (input.projectReference !== undefined) body.project_reference = input.projectReference;
      if (input.fundingSource !== undefined) body.funding_source = input.fundingSource;
      if (input.contractor !== undefined) body.contractor = input.contractor;
      if (input.beneficiaries !== undefined) body.beneficiaries = input.beneficiaries;
      if (input.impactSummary !== undefined) body.impact_summary = input.impactSummary;
      if (input.lessonsLearned !== undefined) body.lessons_learned = input.lessonsLearned;
      return apiFetch(config, `/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    },

    addProgress(id: string, input: AddProgressInput): Promise<ProgressLogEntry[]> {
      return apiFetch(config, `/campaigns/${id}/progress`, { method: 'POST', body: JSON.stringify(input) });
    },

    certifyDeliverable(id: string, input: CertifyDeliverableInput): Promise<CertifiedDeliverable[]> {
      return apiFetch(config, `/campaigns/${id}/deliverables`, { method: 'POST', body: JSON.stringify(input) });
    },

    complete(id: string, input: { impactSummary: string; lessonsLearned: string }): Promise<CampaignWithSponsor> {
      return apiFetch(config, `/campaigns/${id}/complete`, { method: 'POST', body: JSON.stringify(input) });
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
