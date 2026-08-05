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
import { sidebarItems, type NavMainItem } from '@/navigation/sidebar/sidebar-items';

type SearchItem = {
  id: string;
  group: string;
  label: string;
  url: string;
  icon?: NavMainItem['icon'];
};

const searchItems: SearchItem[] = sidebarItems.flatMap((group) =>
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

function groupBy(items: SearchItem[]) {
  const groups = [...new Set(items.map((i) => i.group))];
  return groups.map((group) => ({ group, items: items.filter((i) => i.group === group) }));
}

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) setQuery('');
  };

  const handleSelect = (item: SearchItem) => {
    handleOpenChange(false);
    router.push(item.url);
  };

  const renderGroups = (items: SearchItem[]) =>
    groupBy(items).map(({ group, items: groupItems }, index) => (
      <React.Fragment key={group}>
        {index > 0 && <CommandSeparator />}
        <CommandGroup heading={group}>
          {groupItems.map((item) => (
            <CommandItem key={item.id} value={`${item.group} ${item.label}`} onSelect={() => handleSelect(item)}>
              <span className="flex min-w-0 items-center gap-2">
                {item.icon && <item.icon />}
                <span className="truncate">{item.label}</span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </React.Fragment>
    ));

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
            {renderGroups(searchItems)}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
