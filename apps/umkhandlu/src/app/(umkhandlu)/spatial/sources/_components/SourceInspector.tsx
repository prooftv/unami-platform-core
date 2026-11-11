'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { inspectSourceLayersAction, inspectLayerFieldsAction } from '../../_actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ChevronDown, ChevronRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface LayerRef {
  id: number;
  name: string;
  type?: string;
  geometryType?: string;
}

interface LayerDetail {
  id: number;
  name: string;
  geometryType?: string;
  fields: Array<{ name: string; type: string; alias?: string }>;
  description?: string;
  copyrightText?: string;
}

interface Props {
  sourceId: string;
  sourceType: string;
  hasBaseUrl: boolean;
}

export function SourceInspector({ sourceId, sourceType, hasBaseUrl }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [layers, setLayers] = useState<LayerRef[] | null>(null);
  const [crs, setCrs] = useState<{ wkid?: number; latestWkid?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedLayer, setExpandedLayer] = useState<number | null>(null);
  const [layerDetails, setLayerDetails] = useState<Map<number, LayerDetail>>(new Map());
  const [loadingLayer, setLoadingLayer] = useState<number | null>(null);

  const isArcGIS = sourceType.startsWith('arcgis');

  async function discover() {
    setPending(true);
    setError(null);
    setLayers(null);
    const res = await inspectSourceLayersAction(sourceId);
    if (res.error) {
      setError(res.error);
    } else if (res.layers) {
      setLayers(res.layers as LayerRef[]);
      setCrs((res.spatialReference as { wkid?: number; latestWkid?: number }) ?? null);
      router.refresh();
    }
    setPending(false);
  }

  async function inspectLayer(layerId: number) {
    if (expandedLayer === layerId) {
      setExpandedLayer(null);
      return;
    }
    setExpandedLayer(layerId);
    if (layerDetails.has(layerId)) return;
    setLoadingLayer(layerId);
    const res = await inspectLayerFieldsAction(sourceId, layerId);
    if (res.success && res.layer) {
      setLayerDetails((prev) => new Map(prev).set(layerId, res.layer as LayerDetail));
    }
    setLoadingLayer(null);
  }

  if (!hasBaseUrl) {
    return (
      <p className="text-sm text-muted-foreground">
        No base URL configured. Add a base URL to enable endpoint discovery.
      </p>
    );
  }

  if (!isArcGIS) {
    return (
      <p className="text-sm text-muted-foreground">
        Layer discovery is available for ArcGIS FeatureServer and MapServer sources.
        This source type ({sourceType}) requires manual configuration.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={discover} disabled={pending}>
          <Search className="size-4 mr-1.5" />
          {pending ? 'Discovering…' : 'Discover layers'}
        </Button>
        {crs && (
          <span className="text-xs text-muted-foreground">
            CRS: EPSG:{crs.latestWkid ?? crs.wkid}
            {crs.wkid === 102100 && ' (Web Mercator — reprojection required for WGS84 storage)'}
            {crs.wkid === 4326 && ' (WGS84 — native, no reprojection needed)'}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-destructive">
          <XCircle className="size-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {layers !== null && layers.length === 0 && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <p>Service responded but returned no layers. The service may be empty or require authentication.</p>
        </div>
      )}

      {layers !== null && layers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="size-4 text-green-600" />
              {layers.length} layer{layers.length !== 1 ? 's' : ''} discovered
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {layers.map((layer) => {
                const detail = layerDetails.get(layer.id);
                const isExpanded = expandedLayer === layer.id;
                return (
                  <div key={layer.id}>
                    <button
                      type="button"
                      onClick={() => inspectLayer(layer.id)}
                      className="w-full px-6 py-3 flex items-center justify-between gap-4 hover:bg-muted/30 text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                            {layer.id}
                          </span>
                          <p className="text-sm font-medium truncate">{layer.name}</p>
                        </div>
                        {layer.geometryType && (
                          <p className="text-xs text-muted-foreground pl-8">
                            {layer.geometryType.replace('esriGeometry', '')}
                            {layer.type && ` · ${layer.type}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {loadingLayer === layer.id && (
                          <span className="text-xs text-muted-foreground">Loading…</span>
                        )}
                        {isExpanded
                          ? <ChevronDown className="size-4 text-muted-foreground" />
                          : <ChevronRight className="size-4 text-muted-foreground" />
                        }
                      </div>
                    </button>

                    {isExpanded && detail && (
                      <div className="px-6 pb-4 space-y-3 bg-muted/20">
                        {detail.description && (
                          <p className="text-xs text-muted-foreground">{detail.description}</p>
                        )}
                        {detail.copyrightText && (
                          <p className="text-xs text-amber-700">© {detail.copyrightText}</p>
                        )}
                        <div>
                          <p className="text-xs font-medium mb-1.5">
                            Fields ({detail.fields.length})
                          </p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                            {detail.fields.map((f) => (
                              <div key={f.name} className="flex items-baseline gap-2 text-xs">
                                <span className="font-mono text-foreground">{f.name}</span>
                                <span className="text-muted-foreground">
                                  {f.type.replace('esriFieldType', '')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Layer ID {detail.id} — use this when registering a dataset against this source.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
