import { apiFetch, type ApiConfig } from '../http';
import type { Sponsor, PaginatedResponse } from '../types/index';
import type { SponsorTier } from '@moments/shared';

export interface SponsorStats {
  total: number;
  active: number;
  byTier: Record<SponsorTier, number>;
}

export interface CreateSponsorInput {
  name: string;
  displayName: string;
  contactEmail?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  tier?: SponsorTier;
  monthlyBudget?: number;
}

export type UpdateSponsorInput = Partial<Omit<CreateSponsorInput, 'name'>> & { active?: boolean };

export function createSponsorsClient(config: ApiConfig) {
  return {
    list(params?: { page?: number; limit?: number; active?: boolean; tier?: SponsorTier }): Promise<PaginatedResponse<Sponsor>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/sponsors${qs}`);
    },

    get(id: string): Promise<Sponsor> {
      return apiFetch(config, `/sponsors/${id}`);
    },

    stats(): Promise<SponsorStats> {
      return apiFetch(config, '/sponsors/stats');
    },

    create(input: CreateSponsorInput): Promise<Sponsor> {
      const body = {
        name: input.name,
        display_name: input.displayName,
        contact_email: input.contactEmail ?? null,
        logo_url: input.logoUrl ?? null,
        website_url: input.websiteUrl ?? null,
        tier: input.tier ?? 'bronze',
        monthly_budget: input.monthlyBudget ?? 0,
      };
      return apiFetch(config, '/sponsors', { method: 'POST', body: JSON.stringify(body) });
    },

    update(id: string, input: UpdateSponsorInput): Promise<Sponsor> {
      const body: Record<string, unknown> = {};
      if (input.displayName !== undefined) body.display_name = input.displayName;
      if (input.contactEmail !== undefined) body.contact_email = input.contactEmail;
      if (input.logoUrl !== undefined) body.logo_url = input.logoUrl;
      if (input.websiteUrl !== undefined) body.website_url = input.websiteUrl;
      if (input.tier !== undefined) body.tier = input.tier;
      if (input.monthlyBudget !== undefined) body.monthly_budget = input.monthlyBudget;
      if (input.active !== undefined) body.active = input.active;
      return apiFetch(config, `/sponsors/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    },
  };
}
