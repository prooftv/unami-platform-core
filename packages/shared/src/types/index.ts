import type { AdminRole, ModerationStatus, MessageType } from '../enums/index';

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ---------------------------------------------------------------------------
// AdminUser
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  active: boolean;
  lastLogin: string | null;
  grantedBy: string | null;
  grantedAt: string;
}

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

export interface SystemSetting {
  settingKey: string;
  settingValue: string;
  description: string | null;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Message (inbound — generic across apps)
// ---------------------------------------------------------------------------

export interface Message {
  id: string;
  whatsappId: string;
  fromNumber: string;
  messageType: MessageType;
  content: string | null;
  mediaUrl: string | null;
  mediaId: string | null;
  languageDetected: string | null;
  authorityContext: Record<string, unknown> | null;
  timestamp: string;
  processed: boolean;
  moderationStatus: ModerationStatus;
  createdAt: string;
  updatedAt: string;
}
