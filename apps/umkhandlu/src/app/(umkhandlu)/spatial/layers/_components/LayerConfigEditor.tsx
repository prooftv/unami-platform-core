'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { upsertLayerConfigAction } from '../_actions';
import { Settings2 } from 'lucide-react';

interface LayerConfig {
  id: string;
  display_name: string | null;
  category: string;
  colour: string;
  fill_opacity: number;
  stroke_weight: number;
  stroke_opacity: number;
  point_radius: number;
  visible_default: boolean;
  display_order: number;
  min_zoom: number | null;
  max_zoom: number | null;
  attribution_override: string | null;
  legend_label: string | null;
  active: boolean;
}

interface Props {
  datasetId: string;
  datasetName: string;
  config: LayerConfig | null;
  compact?: boolean;
}

const CATEGORIES = [
  { value: 'administrative', label: 'Administrative' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'education',      label: 'Education' },
  { value: 'health',         label: 'Health' },
  { value: 'cultural',       label: 'Cultural' },
  { value: 'environment',    label: 'Environment' },
  { value: 'land-use',       label: 'Land Use' },
  { value: 'transport',      label: 'Transport' },
  { value: 'general',        label: 'General' },
];

export function LayerConfigEditor({ datasetId, datasetName, config, compact }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [visibleDefault, setVisibleDefault] = useState(config?.visible_default ?? true);
  const [active, setActive] = useState(config?.active ?? true);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('visible_default', String(visibleDefault));
    formData.set('active', String(active));
    startTransition(async () => {
      const result = await upsertLayerConfigAction(datasetId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="size-3.5 mr-1.5" />
          {compact ? 'Configure' : 'Edit'}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Layer Configuration</SheetTitle>
          <p className="text-sm text-muted-foreground">{datasetName}</p>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={config?.display_name ?? datasetName}
              placeholder={datasetName}
            />
            <p className="text-xs text-muted-foreground">Shown in the layer panel. Defaults to dataset name.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select name="category" defaultValue={config?.category ?? 'general'}>
              <SelectTrigger id="category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="colour">Colour</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="colour-picker"
                defaultValue={config?.colour ?? '#3b82f6'}
                onChange={(e) => {
                  const input = document.getElementById('colour') as HTMLInputElement;
                  if (input) input.value = e.target.value;
                }}
                className="h-9 w-12 rounded border cursor-pointer"
              />
              <Input
                id="colour"
                name="colour"
                defaultValue={config?.colour ?? '#3b82f6'}
                placeholder="#3b82f6"
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fill_opacity">Fill opacity (0–1)</Label>
              <Input
                id="fill_opacity"
                name="fill_opacity"
                type="number"
                step="0.05"
                min="0"
                max="1"
                defaultValue={config?.fill_opacity ?? 0.2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stroke_weight">Stroke weight</Label>
              <Input
                id="stroke_weight"
                name="stroke_weight"
                type="number"
                step="0.5"
                min="0"
                defaultValue={config?.stroke_weight ?? 2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stroke_opacity">Stroke opacity (0–1)</Label>
              <Input
                id="stroke_opacity"
                name="stroke_opacity"
                type="number"
                step="0.05"
                min="0"
                max="1"
                defaultValue={config?.stroke_opacity ?? 1}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="point_radius">Point radius (px)</Label>
              <Input
                id="point_radius"
                name="point_radius"
                type="number"
                min="1"
                max="20"
                defaultValue={config?.point_radius ?? 6}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="display_order">Display order</Label>
            <Input
              id="display_order"
              name="display_order"
              type="number"
              defaultValue={config?.display_order ?? 100}
            />
            <p className="text-xs text-muted-foreground">Lower numbers appear first in the layer panel.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="legend_label">Legend label (optional)</Label>
            <Input
              id="legend_label"
              name="legend_label"
              defaultValue={config?.legend_label ?? ''}
              placeholder="Shown in the map legend"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attribution_override">Attribution override (optional)</Label>
            <Input
              id="attribution_override"
              name="attribution_override"
              defaultValue={config?.attribution_override ?? ''}
              placeholder="Overrides dataset/source attribution"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="min_zoom">Min zoom (optional)</Label>
              <Input
                id="min_zoom"
                name="min_zoom"
                type="number"
                min="0"
                max="22"
                defaultValue={config?.min_zoom ?? ''}
                placeholder="e.g. 8"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_zoom">Max zoom (optional)</Label>
              <Input
                id="max_zoom"
                name="max_zoom"
                type="number"
                min="0"
                max="22"
                defaultValue={config?.max_zoom ?? ''}
                placeholder="e.g. 18"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Visible by default</p>
              <p className="text-xs text-muted-foreground">Layer is toggled on when the map loads.</p>
            </div>
            <Switch
              checked={visibleDefault}
              onCheckedChange={setVisibleDefault}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive layers are hidden from the layer panel.</p>
            </div>
            <Switch
              checked={active}
              onCheckedChange={setActive}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Saving…' : 'Save configuration'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
