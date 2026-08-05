'use client';

import { getPreferencePersistence, type PreferenceKey, type PreferenceValueMap } from './preferences-config';

function setClientCookie(key: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

export function persistPreference<K extends PreferenceKey>(key: K, value: PreferenceValueMap[K]): void {
  const mode = getPreferencePersistence(key);
  if (mode === 'client-cookie') {
    setClientCookie(key, value);
  }
  // server-cookie and localStorage modes are handled by the app's server-actions / storage layer
}
