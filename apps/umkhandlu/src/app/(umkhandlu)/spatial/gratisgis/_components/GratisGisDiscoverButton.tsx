'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { discoverGratisGisCollectionsAction } from '../../_actions';
import type { GratisGisCollection } from '@/lib/gis/gratisgis-client';

export function GratisGisDiscoverButton({ sourceId }: { sourceId: string }) {
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<GratisGisCollection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function discover() {
    setLoading(true);
    setError(null);
    setCollections(null);
    const result = await discoverGratisGisCollectionsAction(sourceId);
    if (result.error) {
      setError(result.error);
    } else if (result.collections) {
      setCollections(result.collections);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={discover} disabled={loading}>
        {loading ? 'Discovering…' : 'Discover collections'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {collections !== null && (
        <p className="text-sm text-muted-foreground">
          {collections.length} collection{collections.length !== 1 ? 's' : ''} found in GratisGIS catalogue.
          Go to the source detail page to register individual collections as datasets.
        </p>
      )}
    </div>
  );
}
