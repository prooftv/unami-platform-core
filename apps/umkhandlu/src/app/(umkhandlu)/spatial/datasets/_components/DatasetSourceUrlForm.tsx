'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateDatasetSourceUrlAction } from '../../_actions';

export function DatasetSourceUrlForm({
  datasetId,
  sourceUrl,
}: {
  datasetId: string;
  sourceUrl: string | null;
}) {
  const router = useRouter();
  const actionWithId = updateDatasetSourceUrlAction.bind(null, datasetId);
  const [state, action, pending] = useActionState(
    async (_previous: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await actionWithId(formData);
      if (result.success) router.refresh();
      return result;
    },
    null,
  );

  return (
    <form action={action} className="space-y-2 border-t pt-4">
      <div className="space-y-1.5">
        <Label htmlFor="dataset-source-url">Dataset source URL</Label>
        <Input
          id="dataset-source-url"
          name="source_url"
          type="url"
          defaultValue={sourceUrl ?? ''}
          placeholder="https://data.example.org/dataset"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-700">Source URL saved.</p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? 'Saving…' : 'Save source URL'}
      </Button>
    </form>
  );
}
