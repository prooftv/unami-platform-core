'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { type ShellSearchItem } from '@unami/ui';
import { sidebarItems } from '@/navigation/sidebar/sidebar-items';

const searchItems: ShellSearchItem[] = sidebarItems.flatMap((group) =>
  group.items.flatMap((item) => {
    if ('subItems' in item && item.subItems) {
      return item.subItems.map((sub) => ({
        id: sub.id,
        group: item.title,
        label: sub.title,
        url: sub.url,
        icon: item.icon,
      }));
    }
    return [{ id: item.id, group: group.label ?? 'Navigation', label: item.title, url: (item as { url: string }).url, icon: item.icon }];
  }),
);

const recommendations = searchItems.filter((i) => !i.disabled);

function groupBy(items: ShellSearchItem[]) {
  const groups = [...new Set(items.map((i) => i.group))];
  return groups.map((group) => ({ group, items: items.filter((i) => i.group === group) }));
}

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const router = useRouter();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) setQuery('');
  }

  function handleSelect(item: ShellSearchItem) {
    if (item.disabled) return;
    handleOpenChange(false);
    router.push(item.url);
  }

  function renderGroups(items: ShellSearchItem[]) {
    return groupBy(items).map(({ group, items: groupItems }, i) => (
      <React.Fragment key={group}>
        {i > 0 && <CommandSeparator />}
        <CommandGroup heading={group}>
          {groupItems.map((item) => (
            <CommandItem
              key={`${group}-${item.id}`}
              value={`${item.group} ${item.label}`}
              disabled={item.disabled}
              onSelect={() => handleSelect(item)}
            >
              <span className="flex min-w-0 items-center gap-2">
                {item.icon && <item.icon />}
                <span className="truncate">{item.label}</span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </React.Fragment>
    ));
  }

  return (
    <>
      <Button
        onClick={() => handleOpenChange(true)}
        variant="link"
        className="px-0! font-normal text-muted-foreground hover:no-underline"
      >
        <Search data-icon="inline-start" />
        Search
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command>
          <CommandInput placeholder="Search pages…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {query ? renderGroups(searchItems) : renderGroups(recommendations)}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
