export const Region = {
  KZN: 'KZN',
  WC: 'WC',
  GP: 'GP',
  EC: 'EC',
  FS: 'FS',
  LP: 'LP',
  MP: 'MP',
  NC: 'NC',
  NW: 'NW',
  NATIONAL: 'National',
} as const;
export type Region = (typeof Region)[keyof typeof Region];

export const Category = {
  EDUCATION: 'Education',
  SAFETY: 'Safety',
  CULTURE: 'Culture',
  OPPORTUNITY: 'Opportunity',
  EVENTS: 'Events',
  HEALTH: 'Health',
  TECHNOLOGY: 'Technology',
  COMMUNITY: 'Community',
} as const;
export type Category = (typeof Category)[keyof typeof Category];
