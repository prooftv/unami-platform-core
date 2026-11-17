'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  searchApprovedFeaturesAction,
  associateNoticeSiteFeatureAction,
  removeNoticeSiteFeatureAction,
} from '../../_actions';
import { MapPin, Search, CheckCircle, XCircle, Link2, Link2Off } from 'lucide-react';

interface CurrentAssociation {
  featureId: string;
  datasetName: string;
  associatedAt: string | null;
  associatedBy: string | null;
}

interface SearchResult {
  id: string;
  featureName: string;
  datasetId: string;
  datasetName: string;
  institution: string;
  geometryType: string;
}

interface Props {
  noticeId: string;
  currentAssociation: CurrentAssociation | null;
}

export function NoticeSiteFeatureAssociation({ noticeId, currentAssociation }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    const res = await searchApprovedFeaturesAction(query);
    if (res.error) {
      setSearchError(res.error);
    } else {
      setResults(res.features ?? []);
      if (!res.features?.length) setSearchError('No approved features matched your search.');
    }
    setSearching(false);
  }

  function handleAssociate(feature: SearchResult) {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await associateNoticeSiteFeatureAction(noticeId, feature.id);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess(`Associated with "${feature.featureName}" from ${feature.datasetName}.`);
        setShowSearch(false);
        setResults([]);
        setQuery('');
        router.refresh();
      }
    });
  }

  function handleRemove() {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await removeNoticeSiteFeatureAction(noticeId);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess('Spatial feature association removed.');
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          Site / Property Boundary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentAssociation ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-md bg-green-50 border border-green-200 px-4 py-3">
              <CheckCircle className="size-4 mt-0.5 shrink-0 text-green-600" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-medium text-green-900">Spatial feature associated</p>
                <p className="text-xs text-green-700">{currentAssociation.datasetName}</p>
                {currentAssociation.associatedAt && (
                  <p className="text-xs text-green-600">
                    Associated {new Date(currentAssociation.associatedAt).toLocaleDateString()}
                    {currentAssociation.associatedBy ? ` by ${currentAssociation.associatedBy}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearch((v) => !v)}
                disabled={isPending}
              >
                <Link2 className="size-3.5 mr-1.5" />
                Replace association
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isPending}
                className="text-destructive hover:text-destructive"
              >
                <Link2Off className="size-3.5 mr-1.5" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
              <XCircle className="size-4 mt-0.5 shrink-0 text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-900">No site boundary associated</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Search for an approved spatial feature to associate a verified site or property boundary with this notice.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch((v) => !v)}
              disabled={isPending}
            >
              <Search className="size-3.5 mr-1.5" />
              Search for a spatial feature
            </Button>
          </div>
        )}

        {showSearch && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <Label htmlFor="feature-search">Search approved features</Label>
              <div className="flex gap-2">
                <Input
                  id="feature-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                  placeholder="Feature name, dataset name…"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={searching || !query.trim()}
                >
                  {searching ? 'Searching…' : 'Search'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Only approved features from published datasets are shown.
              </p>
            </div>

            {searchError && (
              <p className="text-sm text-amber-700">{searchError}</p>
            )}

            {results.length > 0 && (
              <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {results.map((feature) => (
                  <div key={feature.id} className="px-4 py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-medium truncate">{feature.featureName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {feature.datasetName}
                        {feature.institution ? ` · ${feature.institution}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">{feature.geometryType}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAssociate(feature)}
                      disabled={isPending}
                    >
                      Associate
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {actionError && (
          <p className="text-sm text-destructive">{actionError}</p>
        )}
        {actionSuccess && (
          <p className="text-sm text-green-700">{actionSuccess}</p>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed">
          The associated feature provides the verified site boundary shown on the public notice map.
          Only approved features from published datasets can be associated.
          All associations are recorded in the audit log.
        </p>
      </CardContent>
    </Card>
  );
}
