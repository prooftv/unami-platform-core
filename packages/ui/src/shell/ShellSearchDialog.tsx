'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ShellSearchItem {
  id: string;
  group: string;
  label: string;
  url: string;
  icon?: LucideIcon;
  disabled?: boolean;
  newTab?: boolean;
}

interface Props {
  items: ShellSearchItem[];
  onNavigate: (url: string, newTab?: boolean) => void;
  placeholder?: string;
  shortcut?: string;
}

function groupBy(items: ShellSearchItem[]) {
  const groups = [...new Set(items.map((i) => i.group))];
  return groups.map((group) => ({ group, items: items.filter((i) => i.group === group) }));
}

export function ShellSearchDialog({ items, onNavigate, placeholder = 'Search...', shortcut = 'J' }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === shortcut.toLowerCase() && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcut]);

  function close() { setOpen(false); setQuery(''); }

  function handleSelect(item: ShellSearchItem) {
    if (item.disabled) return;
    close();
    onNavigate(item.url, item.newTab);
  }

  const visible = query ? items : items.filter((i) => !i.disabled);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none"
      >
        <Search className="h-4 w-4" />
        Search
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>{shortcut}
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={close}>
          <div className="w-full max-w-lg rounded-xl border bg-popover shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Command className="overflow-hidden rounded-xl">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder={placeholder}
                  className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
                {groupBy(visible).map(({ group, items: groupItems }, i) => (
                  <React.Fragment key={group}>
                    {i > 0 && <Command.Separator className="my-1 h-px bg-border" />}
                    <Command.Group heading={group} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                      {groupItems.map((item) => (
                        <Command.Item
                          key={`${group}-${item.id}`}
                          value={`${item.group} ${item.label}`}
                          disabled={item.disabled}
                          onSelect={() => handleSelect(item)}
                          className="flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                          <span className="truncate">{item.label}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </React.Fragment>
                ))}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
