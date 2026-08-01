import { apiFetch, type ApiConfig } from '../http';
import type { PaginatedResponse } from '../types/index';

export interface FeatureFlag {
  flagKey: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string;
}

export interface SystemSetting {
  settingKey: string;
  settingValue: string;
  description: string | null;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

export interface ErrorLogEntry {
  id: string;
  errorType: string;
  errorMessage: string;
  context: Record<string, unknown> | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export function createSettingsClient(config: ApiConfig) {
  return {
    listFlags(): Promise<FeatureFlag[]> {
      return apiFetch(config, '/settings/flags');
    },

    updateFlag(flagKey: string, enabled: boolean): Promise<FeatureFlag> {
      return apiFetch(config, `/settings/flags/${flagKey}`, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
    },

    listSystemSettings(): Promise<SystemSetting[]> {
      return apiFetch(config, '/settings/system');
    },

    updateSystemSetting(settingKey: string, value: string): Promise<SystemSetting> {
      return apiFetch(config, `/settings/system/${settingKey}`, {
        method: 'POST',
        body: JSON.stringify({ value }),
      });
    },

    auditLogs(params?: { page?: number; limit?: number; resourceType?: string; userId?: string }): Promise<PaginatedResponse<AuditLogEntry>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/settings/audit-logs${qs}`);
    },

    errorLogs(params?: { page?: number; limit?: number; severity?: string }): Promise<PaginatedResponse<ErrorLogEntry>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/settings/error-logs${qs}`);
    },
  };
}
