import type { UserRecord } from '@/domain/uncip/types';

/** Build a userId → UserRecord lookup map from a flat array. */
export function buildUsersMap(users: UserRecord[]): Record<string, UserRecord> {
  return Object.fromEntries(users.map((u) => [u.id, u]));
}
