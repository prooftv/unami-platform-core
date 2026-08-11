"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  getPreferencePersistence,
  PREFERENCE_REGISTRY,
  type PreferenceKey,
  type PreferenceValueMap,
  parsePreference,
} from "@unami/ui";
import type { UNCIPRole } from "@/domain/uncip";

// ─── Mock role switcher — FOUNDATION PHASE ONLY ───────────────────────────────
// Sets the mock_role cookie so getUNCIPSession() returns the selected role.
// Remove this function when the auth phase begins.
export async function setMockRole(role: UNCIPRole): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('mock_role', role, { path: '/', maxAge: 60 * 60 * 24 });
  revalidatePath('/', 'layout');
}

export async function getValueFromCookie(key: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(key)?.value;
}

export async function setValueToCookie(
  key: string,
  value: string,
  options: { path?: string; maxAge?: number } = {},
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(key, value, {
    path: options.path ?? "/",
    maxAge: options.maxAge ?? 60 * 60 * 24 * 7,
  });
}

export async function getPreference<K extends PreferenceKey>(key: K): Promise<PreferenceValueMap[K]> {
  const definition = PREFERENCE_REGISTRY[key];
  const persistence = getPreferencePersistence(key);

  if (persistence !== "client-cookie" && persistence !== "server-cookie") {
    return definition.defaultValue as PreferenceValueMap[K];
  }

  const cookieStore = await cookies();
  return parsePreference(key, cookieStore.get(key)?.value.trim());
}
