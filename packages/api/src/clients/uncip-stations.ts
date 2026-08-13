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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WireRecord = Record<string, any>;

function fromWire(r: WireRecord): UNCIPStation {
  return {
    id:           r.id,
    name:         r.name,
    province:     r.province,
    district:     r.district ?? null,
    contactPhone: r.contact_phone ?? null,
    lat:          r.lat ?? null,
    lng:          r.lng ?? null,
    createdAt:    r.created_at,
  };
}

export function createUNCIPStationsClient(config: ApiConfig) {
  return {
    list(params?: { province?: Province }): Promise<{ data: UNCIPStation[] }> {
      const raw: Record<string, string> = {};
      if (params?.province) raw.province = params.province;
      const qs = Object.keys(raw).length ? '?' + new URLSearchParams(raw).toString() : '';
      return apiFetch<{ data: WireRecord[] }>(config, `/uncip-stations${qs}`)
        .then(r => ({ data: r.data.map(fromWire) }));
    },

    get(id: string): Promise<{ data: UNCIPStation }> {
      return apiFetch<{ data: WireRecord }>(config, `/uncip-stations/${id}`)
        .then(r => ({ data: fromWire(r.data) }));
    },

    create(input: CreateStationInput): Promise<{ data: UNCIPStation }> {
      return apiFetch<{ data: WireRecord }>(config, '/uncip-stations', {
        method: 'POST',
        body: JSON.stringify({
          name:          input.name,
          province:      input.province,
          district:      input.district ?? null,
          contact_phone: input.contactPhone ?? null,
          lat:           input.lat ?? null,
          lng:           input.lng ?? null,
        }),
      }).then(r => ({ data: fromWire(r.data) }));
    },
  };
}
