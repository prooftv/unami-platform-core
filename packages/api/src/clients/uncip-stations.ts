import { apiFetch, type ApiConfig } from '../http';
import type { Province } from './uncip-children';

export interface UNCIPStation {
  id: string;
  name: string;
  province: Province;
  district: string | null;
  contactPhone: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
}

export interface CreateStationInput {
  name: string;
  province: Province;
  district?: string | null;
  contactPhone?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export function createUNCIPStationsClient(config: ApiConfig) {
  return {
    list(params?: { province?: Province }): Promise<{ data: UNCIPStation[] }> {
      const raw: Record<string, string> = {};
      if (params?.province) raw.province = params.province;
      const qs = Object.keys(raw).length ? '?' + new URLSearchParams(raw).toString() : '';
      return apiFetch(config, `/uncip-stations${qs}`);
    },

    get(id: string): Promise<{ data: UNCIPStation }> {
      return apiFetch(config, `/uncip-stations/${id}`);
    },

    create(input: CreateStationInput): Promise<{ data: UNCIPStation }> {
      return apiFetch(config, '/uncip-stations', {
        method: 'POST',
        body: JSON.stringify({
          name:          input.name,
          province:      input.province,
          district:      input.district ?? null,
          contact_phone: input.contactPhone ?? null,
          lat:           input.lat ?? null,
          lng:           input.lng ?? null,
        }),
      });
    },
  };
}
