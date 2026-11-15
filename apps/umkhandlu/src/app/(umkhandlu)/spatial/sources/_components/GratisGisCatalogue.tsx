'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  discoverGratisGisCollectionsAction,
  registerGratisGisCollectionAction,
} from '../../_actions';
import { Button } from '@/components/ui/button';
import type { GratisGisCollection } from '@/lib/gis/gratisgis-client';

export function GratisGisCatalogue({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const [collections, setCollections] = useState<GratisGisCollection[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function discover() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await discoverGratisGisCollectionsAction(sourceId);
      if (result.error) {
        setMessage(result.error);
      } else if (result.collections) {
        setCollections(result.collections);
      } else {
        setMessage('GratisGIS returned no collection catalogue.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'GratisGIS catalogue discovery failed.');
    } finally {
      setLoading(false);
    }
  }

  async function register(collection: GratisGisCollection) {
    setLoading(true);
    setMessage(null);
    try {
      const result = await registerGratisGisCollectionAction(sourceId, collection.id);
      if (result.error) {
        setMessage(result.error);
      } else if (result.success) {
        setMessage(`Registered "${collection.title}" as pending permission review.`);
        router.refresh();
      } else {
        setMessage('GratisGIS collection registration did not complete.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'GratisGIS collection registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Uses the configured server-side OGC API endpoint. Catalogue metadata is evidence only;
        every new dataset remains pending until an operator verifies its authority and permissions.
      </p>
      <Button type="button" onClick={discover} disabled={loading}>
        {loading ? 'Loading…' : 'Discover collections'}
      </Button>
      {message && <p className="text-sm" role="status">{message}</p>}
      {collections.length > 0 && (
        <div className="divide-y rounded-md border">
          {collections.map((collection) => (
            <div key={collection.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">{collection.title}</p>
                <p className="break-all font-mono text-xs text-muted-foreground">{collection.id}</p>
                {collection.license && (
                  <p className="text-xs text-muted-foreground">
                    Upstream license metadata (unverified): {collection.license}
                  </p>
                )}
              </div>
              <Button type="button" variant="outline" disabled={loading} onClick={() => register(collection)}>
                Register pending dataset
              </Button>
            </div>
          ))}
        </div>
      )}
      {collections.length === 0 && !loading && message === null && (
        <p className="text-xs text-muted-foreground">No collections discovered yet.</p>
      )}
    </div>
  );
}
