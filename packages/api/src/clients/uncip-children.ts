import { apiFetch, type ApiConfig } from '../http';
import type { PaginatedResponse } from '../types/index';

// Province re-exported so other clients can import from one place
export type Province =
  | 'eastern_cape' | 'free_state' | 'gauteng' | 'kwazulu_natal'
  | 'limpopo' | 'mpumalanga' | 'north_west' | 'northern_cape' | 'western_cape';

export type ChildGender = 'male' | 'female' | 'other';
export type GuardianRelationship = 'parent' | 'grandparent' | 'foster_carer' | 'other';

export interface UNCIPGuardianLink {
  id: string;
  childId: string;
  userId: string;
  relationship: GuardianRelationship;
  isPrimary: boolean;
  createdAt: string;
}

export interface UNCIPChildMedical {
  id: string;
  childId: string;
  bloodType: string | null;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UNCIPChild {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: ChildGender;
  photoUrl: string | null;
  identificationNumber: string | null;
  schoolId: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressProvince: Province | null;
  addressPostalCode: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Joined relations — present on detail, may be absent on list
  uncipGuardianLinks?: UNCIPGuardianLink[];
  uncipChildMedical?: UNCIPChildMedical | null;
}

export interface CreateChildInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: ChildGender;
  photoUrl?: string | null;
  identificationNumber?: string | null;
  schoolId?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressProvince?: Province | null;
  addressPostalCode?: string | null;
}

export type UpdateChildInput = Partial<CreateChildInput>;

export interface AddGuardianInput {
  userId: string;
  relationship: GuardianRelationship;
  isPrimary?: boolean;
}

export interface ListChildrenParams {
  page?: number;
  limit?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WireRecord = Record<string, any>;

function fromWireGuardian(g: WireRecord): UNCIPGuardianLink {
  return {
    id:           g.id,
    childId:      g.child_id,
    userId:       g.user_id,
    relationship: g.relationship,
    isPrimary:    g.is_primary,
    createdAt:    g.created_at,
  };
}

function fromWire(r: WireRecord): UNCIPChild {
  return {
    id:                   r.id,
    firstName:            r.first_name,
    lastName:             r.last_name,
    dateOfBirth:          r.date_of_birth,
    gender:               r.gender,
    photoUrl:             r.photo_url ?? null,
    identificationNumber: r.identification_number ?? null,
    schoolId:             r.school_id ?? null,
    addressStreet:        r.address_street ?? null,
    addressCity:          r.address_city ?? null,
    addressProvince:      r.address_province ?? null,
    addressPostalCode:    r.address_postal_code ?? null,
    createdBy:            r.created_by,
    createdAt:            r.created_at,
    updatedAt:            r.updated_at,
    uncipGuardianLinks:   Array.isArray(r.uncip_guardian_links)
      ? r.uncip_guardian_links.map(fromWireGuardian)
      : undefined,
    uncipChildMedical: r.uncip_child_medical ?? undefined,
  };
}

function toWire(input: CreateChildInput): Record<string, unknown> {
  return {
    first_name:            input.firstName,
    last_name:             input.lastName,
    date_of_birth:         input.dateOfBirth,
    gender:                input.gender,
    photo_url:             input.photoUrl ?? null,
    identification_number: input.identificationNumber ?? null,
    school_id:             input.schoolId ?? null,
    address_street:        input.addressStreet ?? null,
    address_city:          input.addressCity ?? null,
    address_province:      input.addressProvince ?? null,
    address_postal_code:   input.addressPostalCode ?? null,
  };
}

export function createUNCIPChildrenClient(config: ApiConfig) {
  return {
    list(params?: ListChildrenParams): Promise<PaginatedResponse<UNCIPChild>> {
      const raw: Record<string, string> = {};
      if (params?.page)  raw.page  = String(params.page);
      if (params?.limit) raw.limit = String(params.limit);
      const qs = Object.keys(raw).length ? '?' + new URLSearchParams(raw).toString() : '';
      return apiFetch<PaginatedResponse<WireRecord>>(config, `/uncip-children${qs}`)
        .then(r => ({ ...r, data: r.data.map(fromWire) }));
    },

    get(id: string): Promise<{ data: UNCIPChild }> {
      return apiFetch<{ data: WireRecord }>(config, `/uncip-children/${id}`)
        .then(r => ({ data: fromWire(r.data) }));
    },

    create(input: CreateChildInput): Promise<{ data: UNCIPChild }> {
      return apiFetch<{ data: WireRecord }>(config, '/uncip-children', {
        method: 'POST',
        body: JSON.stringify(toWire(input)),
      }).then(r => ({ data: fromWire(r.data) }));
    },

    update(id: string, input: UpdateChildInput): Promise<{ data: UNCIPChild }> {
      return apiFetch<{ data: WireRecord }>(config, `/uncip-children/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(toWire(input as CreateChildInput)),
      }).then(r => ({ data: fromWire(r.data) }));
    },

    addGuardian(childId: string, input: AddGuardianInput): Promise<{ data: UNCIPGuardianLink }> {
      return apiFetch(config, `/uncip-children/${childId}/guardians`, {
        method: 'POST',
        body: JSON.stringify({
          user_id:      input.userId,
          relationship: input.relationship,
          is_primary:   input.isPrimary ?? false,
        }),
      });
    },
  };
}
