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
  lat: number | null;
  lng: number | null;
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
  lat?: number | null;
  lng?: number | null;
}

export interface ListSchoolsParams {
  province?: Province;
  stationId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WireRecord = Record<string, any>;

function fromWire(r: WireRecord): UNCIPSchool {
  return {
    id:           r.id,
    name:         r.name,
    emis:         r.emis ?? null,
    province:     r.province,
    address:      r.address,
    contactPhone: r.contact_phone ?? null,
    contactEmail: r.contact_email ?? null,
    stationId:    r.station_id ?? null,
    lat:          r.lat ?? null,
    lng:          r.lng ?? null,
    createdAt:    r.created_at,
  };
}

export function createUNCIPSchoolsClient(config: ApiConfig) {
  return {
    list(params?: ListSchoolsParams): Promise<{ data: UNCIPSchool[] }> {
      const raw: Record<string, string> = {};
      if (params?.province)  raw.province   = params.province;
      if (params?.stationId) raw.station_id = params.stationId;
      const qs = Object.keys(raw).length ? '?' + new URLSearchParams(raw).toString() : '';
      return apiFetch<{ data: WireRecord[] }>(config, `/uncip-schools${qs}`)
        .then(r => ({ data: r.data.map(fromWire) }));
    },

    get(id: string): Promise<{ data: UNCIPSchool }> {
      return apiFetch<{ data: WireRecord }>(config, `/uncip-schools/${id}`)
        .then(r => ({ data: fromWire(r.data) }));
    },

    create(input: CreateSchoolInput): Promise<{ data: UNCIPSchool }> {
      return apiFetch<{ data: WireRecord }>(config, '/uncip-schools', {
        method: 'POST',
        body: JSON.stringify({
          name:          input.name,
          province:      input.province,
          address:       input.address,
          station_id:    input.stationId ?? null,
          emis:          input.emis ?? null,
          contact_phone: input.contactPhone ?? null,
          contact_email: input.contactEmail ?? null,
          lat:           input.lat ?? null,
          lng:           input.lng ?? null,
        }),
      }).then(r => ({ data: fromWire(r.data) }));
    },
  };
}
