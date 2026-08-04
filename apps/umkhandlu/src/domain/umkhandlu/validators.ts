import { z } from 'zod';

export const CreateRecordSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  parentRecordId: z.string().uuid().nullable().optional(),
  originNoticeId: z.string().uuid().nullable().optional(),
});

export const CreateNoticeSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  commentDeadline: z.string().datetime().nullable().optional(),
});

export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;
export type CreateNoticeInput = z.infer<typeof CreateNoticeSchema>;
