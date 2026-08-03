'use client';

import { useCallback, useState } from 'react';

/**
 * Manages checkbox selection state for a list of items.
 * Generic over any type T that has a string id field.
 *
 * @param getKey - function to extract the string ID from an item
 */
export function useBulkSelection<T>(getKey: (item: T) => string) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((items: T[]) => {
    setSelected((prev) => {
      const allIds = items.map(getKey);
      const allSelected = allIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(allIds);
    });
  }, [getKey]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isAllSelected = useCallback(
    (items: T[]) => items.length > 0 && items.every((item) => selected.has(getKey(item))),
    [selected, getKey]
  );

  return {
    selected,
    toggle,
    toggleAll,
    clear,
    isAllSelected,
    selectedCount: selected.size,
  };
}
