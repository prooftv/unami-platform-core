import { Select } from 'radix-ui';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';

export const SelectRoot = Select.Root;
export const SelectValue = Select.Value;

export function SelectTrigger({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof Select.Trigger>) {
  return (
    <Select.Trigger
      className={clsx(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <Select.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Select.Icon>
    </Select.Trigger>
  );
}

export function SelectContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof Select.Content>) {
  return (
    <Select.Portal>
      <Select.Content
        className={clsx(
          'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
          className,
        )}
        position="popper"
        sideOffset={4}
        {...props}
      >
        <Select.Viewport className="p-1">{children}</Select.Viewport>
      </Select.Content>
    </Select.Portal>
  );
}

export function SelectItem({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof Select.Item>) {
  return (
    <Select.Item
      className={clsx(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <Select.ItemIndicator>
          <Check className="h-4 w-4" />
        </Select.ItemIndicator>
      </span>
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  );
}
