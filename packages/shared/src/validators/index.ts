import { z } from 'zod';
import { AdminRole } from '../enums/index';

// ---------------------------------------------------------------------------
// Auth
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
