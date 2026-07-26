import { z } from 'zod';
import {
  MomentStatus,
  ContentSource,
  UrgencyLevel,
  Language,
  Category,
  Region,
  SponsorTier,
  CampaignStatus,
  DeliverySchedule,
  IntentChannel,
  AuthorityScope,
  ApprovalMode,
  AdminRole,
} from '../enums/index.js';
import { LIMITS } from '../constants/index.js';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const regionSchema = z.enum(Object.values(Region) as [string, ...string[]]);
const categorySchema = z.enum(Object.values(Category) as [string, ...string[]]);
const languageSchema = z.enum(Object.values(Language) as [string, ...string[]]);
const urgencySchema = z.enum(Object.values(UrgencyLevel) as [string, ...string[]]);

// ---------------------------------------------------------------------------
// Moment
// ---------------------------------------------------------------------------

export const CreateMomentSchema = z.object({
  title: z.string().min(LIMITS.MOMENT_TITLE_MIN).max(LIMITS.MOMENT_TITLE_MAX),
  content: z.string().min(LIMITS.MOMENT_CONTENT_MIN).max(LIMITS.MOMENT_CONTENT_MAX),
  region: regionSchema,
  category: categorySchema,
  language: languageSchema.default(Language.ENGLISH),
  sponsorId: z.string().uuid().nullable().default(null),
  isSponsored: z.boolean().default(false),
  pwaLink: z.string().url().nullable().default(null),
  mediaUrls: z.array(z.string().url()).default([]),
  scheduledAt: z.string().datetime().nullable().default(null),
  urgencyLevel: urgencySchema.default(UrgencyLevel.LOW),
  publishToPwa: z.boolean().default(true),
  publishToWhatsapp: z.boolean().default(false),
});
export type CreateMomentInput = z.infer<typeof CreateMomentSchema>;

export const UpdateMomentSchema = CreateMomentSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' },
);
export type UpdateMomentInput = z.infer<typeof UpdateMomentSchema>;

export const BroadcastMomentSchema = z.object({
  momentId: z.string().uuid(),
});
export type BroadcastMomentInput = z.infer<typeof BroadcastMomentSchema>;

export const ScheduleMomentSchema = z.object({
  scheduledAt: z.string().datetime(),
});
export type ScheduleMomentInput = z.infer<typeof ScheduleMomentSchema>;

export const ListMomentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(LIMITS.BROADCAST_BATCH_SIZE * 2).default(20),
  status: z.enum(Object.values(MomentStatus) as [string, ...string[]]).optional(),
  region: regionSchema.optional(),
  category: categorySchema.optional(),
  source: z.enum(Object.values(ContentSource) as [string, ...string[]]).optional(),
  search: z.string().max(200).optional(),
});
export type ListMomentsInput = z.infer<typeof ListMomentsSchema>;

// ---------------------------------------------------------------------------
// Sponsor
// ---------------------------------------------------------------------------

export const CreateSponsorSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Must be a lowercase slug'),
  displayName: z.string().min(1).max(200),
  contactEmail: z.string().email().nullable().default(null),
  logoUrl: z.string().url().nullable().default(null),
  websiteUrl: z.string().url().nullable().default(null),
  tier: z.enum(Object.values(SponsorTier) as [string, ...string[]]).default(SponsorTier.BRONZE),
  monthlyBudget: z.number().nonnegative().default(0),
});
export type CreateSponsorInput = z.infer<typeof CreateSponsorSchema>;

export const UpdateSponsorSchema = CreateSponsorSchema.partial().omit({ name: true });
export type UpdateSponsorInput = z.infer<typeof UpdateSponsorSchema>;

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

export const CreateCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(LIMITS.MOMENT_CONTENT_MIN).max(LIMITS.MOMENT_CONTENT_MAX),
  category: categorySchema,
  sponsorId: z.string().uuid().nullable().default(null),
  budget: z.number().nonnegative().default(0),
  targetRegions: z.array(regionSchema).min(1),
  targetCategories: z.array(categorySchema).default([]),
  mediaUrls: z.array(z.string().url()).default([]),
  scheduledAt: z.string().datetime().nullable().default(null),
});
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const UpdateCampaignSchema = CreateCampaignSchema.partial();
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;

export const ListCampaignsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  status: z.enum(Object.values(CampaignStatus) as [string, ...string[]]).optional(),
  sponsorId: z.string().uuid().optional(),
});
export type ListCampaignsInput = z.infer<typeof ListCampaignsSchema>;

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export const UpdateSubscriptionSchema = z.object({
  regions: z.array(regionSchema).min(1).optional(),
  categories: z.array(categorySchema).min(1).optional(),
  languagePreference: languageSchema.optional(),
  deliverySchedule: z.enum(Object.values(DeliverySchedule) as [string, ...string[]]).optional(),
});
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionSchema>;

export const ListSubscribersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  filter: z.enum(['all', 'active', 'inactive']).default('all'),
});
export type ListSubscribersInput = z.infer<typeof ListSubscribersSchema>;

// ---------------------------------------------------------------------------
// Authority
// ---------------------------------------------------------------------------

export const CreateAuthoritySchema = z.object({
  userIdentifier: z.string().min(1),
  authorityLevel: z.coerce.number().int().min(1).max(5),
  roleLabel: z.string().min(1).max(100),
  scope: z.enum(Object.values(AuthorityScope) as [string, ...string[]]),
  scopeIdentifier: z.string().nullable().default(null),
  approvalMode: z.enum(Object.values(ApprovalMode) as [string, ...string[]]).default(ApprovalMode.ADMIN_REVIEW),
  blastRadius: z.number().int().positive().max(LIMITS.BLAST_RADIUS_MAX).default(LIMITS.BLAST_RADIUS_DEFAULT),
  riskThreshold: z.number().min(0.1).max(0.9).default(0.7),
  validUntil: z.string().datetime().nullable().default(null),
});
export type CreateAuthorityInput = z.infer<typeof CreateAuthoritySchema>;

export const UpdateAuthoritySchema = CreateAuthoritySchema.partial().omit({ userIdentifier: true });
export type UpdateAuthorityInput = z.infer<typeof UpdateAuthoritySchema>;

export const SuspendAuthoritySchema = z.object({
  reason: z.string().min(1).max(500),
});
export type SuspendAuthorityInput = z.infer<typeof SuspendAuthoritySchema>;

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

export const ModerateMessageSchema = z.object({
  action: z.enum(['approve', 'flag', 'reject']),
  reason: z.string().max(500).optional(),
});
export type ModerateMessageInput = z.infer<typeof ModerateMessageSchema>;

export const ListModerationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  filter: z.enum(['all', 'pending', 'flagged', 'high_risk', 'escalated', 'auto_approved']).default('all'),
});
export type ListModerationInput = z.infer<typeof ListModerationSchema>;

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const CreateAdminUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  password: z.string().min(8),
  role: z.enum(Object.values(AdminRole) as [string, ...string[]]),
});
export type CreateAdminUserInput = z.infer<typeof CreateAdminUserSchema>;

export const AssignRoleSchema = z.object({
  role: z.enum(Object.values(AdminRole) as [string, ...string[]]),
});
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const UpdateSettingSchema = z.object({
  value: z.string().min(1),
});
export type UpdateSettingInput = z.infer<typeof UpdateSettingSchema>;

export const UpdateBudgetSettingsSchema = z.object({
  monthlyBudget: z.number().positive(),
  warningThreshold: z.number().int().min(1).max(100),
  messageCost: z.number().positive(),
  dailyLimit: z.number().int().positive(),
});
export type UpdateBudgetSettingsInput = z.infer<typeof UpdateBudgetSettingsSchema>;

// ---------------------------------------------------------------------------
// Compliance
// ---------------------------------------------------------------------------

export const ComplianceCheckSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: categorySchema,
});
export type ComplianceCheckInput = z.infer<typeof ComplianceCheckSchema>;

// ---------------------------------------------------------------------------
// Intent
// ---------------------------------------------------------------------------

export const CreateIntentSchema = z.object({
  momentId: z.string().uuid(),
  channel: z.enum(Object.values(IntentChannel) as [string, ...string[]]),
});
export type CreateIntentInput = z.infer<typeof CreateIntentSchema>;
