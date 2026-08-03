'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@unami/ui';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import type { Subscription, SubscriberStats } from '@unami/api';

interface Props {
  subscriber: Subscription;
  stats: SubscriberStats | null;
}

export function SubscriberDetailClient({ subscriber, stats: _stats }: Props) {
  const router = useRouter();
  const [opting, setOpting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleOptOut() {
    if (!confirm('Manually opt out this subscriber? This cannot be undone.')) return;
    setOpting(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      await api.subscribers.optOut(subscriber.id);
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opt-out failed');
    } finally {
      setOpting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriber"
        description={subscriber.phoneNumber}
        actions={
          subscriber.optedIn && !done ? (
            <Button variant="destructive" size="sm" onClick={handleOptOut} disabled={opting}>
              {opting ? 'Processing...' : 'Manual Opt-out'}
            </Button>
          ) : undefined
        }
      />

      {done && <p className="text-sm text-muted-foreground">Subscriber has been opted out.</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Opted in</span>
                <Badge variant={subscriber.optedIn ? 'default' : 'destructive'}>{subscriber.optedIn ? 'Yes' : 'No'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Schedule</span>
                <Badge variant="outline">{subscriber.deliverySchedule}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="font-medium">{subscriber.languagePreference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Double opt-in</span>
                <span className="font-medium">{subscriber.doubleOptInConfirmed ? 'Confirmed' : 'Pending'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dates</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span className="font-medium">{new Date(subscriber.optedInAt).toLocaleDateString()}</span>
              </div>
              {subscriber.optedOutAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Opted out</span>
                  <span className="font-medium">{new Date(subscriber.optedOutAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last activity</span>
                <span className="font-medium">{new Date(subscriber.lastActivity).toLocaleDateString()}</span>
              </div>
              {subscriber.consentTimestamp && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Consent</span>
                  <span className="font-medium">{new Date(subscriber.consentTimestamp).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Regions</p>
              <div className="flex flex-wrap gap-1">
                {subscriber.regions.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Categories</p>
              <div className="flex flex-wrap gap-1">
                {subscriber.categories.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
