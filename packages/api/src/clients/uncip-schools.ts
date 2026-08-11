import { apiFetch, type ApiConfig } from '../http';
import type { Province } from './uncip-children';

export interface UNCIPSchool {
  id: string;
  name: string;
  emis: string | null;
  province: Province;
  address: string;
  contactPhone: string | null;
  contactEmail: string | null;
  stationId: string | null;
  createdAt: string;
}

export interface CreateSchoolInput {
  name: string;
  province: Province;
  address: string;
  stationId?: string | null;
  emis?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export interface ListSchoolsParams {
  province?: Province;
  stationId?: string;
}

export function createUNCIPSchoolsClient(config: ApiConfig) {
  return {
    list(params?: ListSchoolsParams): Promise<{ data: UNCIPSchool[] }> {
      const raw: Record<string, string> = {};
      if (params?.province)  raw.province   = params.province;
      if (params?.stationId) raw.station_id = params.stationId;
      const qs = Object.keys(raw).length ? '?' + new URLSearchParams(raw).toString() : '';
      return apiFetch(config, `/uncip-schools${qs}`);
    },

    get(id: string): Promise<{ data: UNCIPSchool }> {
      return apiFetch(config, `/uncip-schools/${id}`);
    },

    create(input: CreateSchoolInput): Promise<{ data: UNCIPSchool }> {
      return apiFetch(config, '/uncip-schools', {
        method: 'POST',
        body: JSON.stringify({
          name:          input.name,
          province:      input.province,
          address:       input.address,
          station_id:    input.stationId ?? null,
          emis:          input.emis ?? null,
          contact_phone: input.contactPhone ?? null,
          contact_email: input.contactEmail ?? null,
        }),
      });
    },
  };
}
