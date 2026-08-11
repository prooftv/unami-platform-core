// SYNTHETIC FIXTURE DATA — DEVELOPMENT ONLY
// These records do not represent real SAPS stations.
// All names, districts, and contact details are fictional.

import type { SAPSStation } from '@/domain/uncip';

export const FIXTURE_STATIONS: SAPSStation[] = [
  {
    id: 'station-001',
    name: 'Khayelitsha SAPS',
    province: 'western_cape',
    district: 'Cape Town Metro',
    contactPhone: null,
  },
  {
    id: 'station-002',
    name: 'Soweto SAPS',
    province: 'gauteng',
    district: 'Johannesburg Metro',
    contactPhone: null,
  },
  {
    id: 'station-003',
    name: 'Umlazi SAPS',
    province: 'kwazulu_natal',
    district: 'eThekwini Metro',
    contactPhone: null,
  },
];
