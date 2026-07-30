import { apiFetch, type ApiConfig } from '../http';

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
  };
}
