export const Language = {
  ENGLISH: 'eng',
  ZULU: 'zul',
  XHOSA: 'xho',
  AFRIKAANS: 'afr',
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export const ModerationStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  FLAGGED: 'flagged',
  REJECTED: 'rejected',
} as const;
export type ModerationStatus = (typeof ModerationStatus)[keyof typeof ModerationStatus];

export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  DOCUMENT: 'document',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const AdminRole = {
  SUPERADMIN: 'superadmin',
  CONTENT_ADMIN: 'content_admin',
  MODERATOR: 'moderator',
  VIEWER: 'viewer',
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];
