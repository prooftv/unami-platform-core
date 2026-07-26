import { Category, Region, DeliverySchedule, AuthorityLevel } from '../enums/index.js';

export const SA_REGIONS = Object.values(Region);

export const REGION_LABELS: Record<string, string> = {
  KZN: 'KwaZulu-Natal',
  WC: 'Western Cape',
  GP: 'Gauteng',
  EC: 'Eastern Cape',
  FS: 'Free State',
  LP: 'Limpopo',
  MP: 'Mpumalanga',
  NC: 'Northern Cape',
  NW: 'North West',
  National: 'National',
};

export const CATEGORIES = Object.values(Category);

export const DEFAULT_REGIONS = [Region.NATIONAL];

export const DEFAULT_CATEGORIES = Object.values(Category);

export const DEFAULT_DELIVERY_SCHEDULE = DeliverySchedule.INSTANT;

// WhatsApp command keywords
export const COMMANDS = {
  OPT_IN: ['START', 'JOIN', 'SUBSCRIBE'],
  OPT_OUT: ['STOP', 'UNSUBSCRIBE', 'QUIT', 'CANCEL'],
  PAUSE: ['PAUSE'],
  HELP: ['HELP', 'INFO', 'MENU', '?'],
  STATUS: ['STATUS', 'SETTINGS'],
  REGIONS: ['REGIONS'],
  INTERESTS: ['INTERESTS', 'CATEGORIES', 'TOPICS'],
  LANGUAGE: ['LANGUAGE'],
  RECENT: ['RECENT'],
  SUBMIT: ['SUBMIT', 'SHARE', 'MOMENTS'],
  SEARCH: ['SEARCH'],
  REPORT: ['REPORT'],
  FEEDBACK: ['FEEDBACK'],
  SCHEDULE: ['SCHEDULE'],
  MY_AUTHORITY: ['MYAUTHORITY'],
} as const;

// Content limits
export const LIMITS = {
  MOMENT_TITLE_MIN: 3,
  MOMENT_TITLE_MAX: 200,
  MOMENT_CONTENT_MIN: 10,
  MOMENT_CONTENT_MAX: 2000,
  COMMENT_MAX: 500,
  BIO_MAX: 200,
  BLAST_RADIUS_MAX: 10000,
  BLAST_RADIUS_DEFAULT: 100,
  RETRY_MAX: 3,
  BROADCAST_BATCH_SIZE: 50,
  DAILY_MESSAGE_LIMIT: 500,
} as const;

// Authority blast radius defaults per level
export const BLAST_RADIUS_BY_LEVEL: Record<AuthorityLevel, number> = {
  [AuthorityLevel.COMMUNITY_MEMBER]: 100,
  [AuthorityLevel.VERIFIED_MEMBER]: 250,
  [AuthorityLevel.COMMUNITY_LEADER]: 500,
  [AuthorityLevel.NGO_PARTNER]: 1000,
  [AuthorityLevel.NATIONAL_AUTHORITY]: 10000,
};

// MCP thresholds
export const MCP = {
  AUTO_APPROVE_THRESHOLD: 0.3,
  ESCALATION_THRESHOLD: 0.7,
  RISK_THRESHOLD_DEFAULT: 0.7,
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Budget defaults
export const BUDGET = {
  MESSAGE_COST_ZAR: 0.05,
  WARNING_THRESHOLD_PERCENT: 80,
} as const;

// Compliance — prohibited terms for WhatsApp broadcast
export const PROHIBITED_TERMS = [
  'vote',
  'election',
  'political party',
  'loan',
  'investment',
  'cryptocurrency',
  'cure',
  'treatment',
  'gambling',
  'bet',
  'lottery',
] as const;

// Sponsor attribution language (Meta-compliant)
export const SPONSOR_ATTRIBUTION_PREFIX = 'In partnership with';
export const OPT_OUT_FOOTER = 'Reply STOP to unsubscribe';
