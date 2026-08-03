'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { Advisory } from '@unami/api';

interface Props { advisory: Advisory; }

function SignalRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {value
        ? <XCircle className="h-4 w-4 text-destructive" />
        : <CheckCircle className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
}

export function AdvisoryDetailClient({ advisory }: Props) {
  const router = useRouter();

  const confidencePct = Math.round(advisory.confidence * 100);
  const confidenceVariant = advisory.confidence >= 0.7 ? 'destructive'
    : advisory.confidence >= 0.4 ? 'secondary'
    : 'outline';

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/moderation')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Advisory Detail</h1>
          <p className="text-sm text-muted-foreground">{advisory.advisoryType}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Assessment</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={confidenceVariant}>{confidencePct}% confidence</Badge>
              {advisory.escalationSuggested && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />Escalated
                </Badge>
              )}
            </div>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>Type: <span className="font-medium text-foreground">{advisory.advisoryType}</span></p>
              <p>Urgency: <span className="font-medium text-foreground">{advisory.urgencyLevel}</span></p>
              <p>Created: <span className="font-medium text-foreground">{new Date(advisory.createdAt).toLocaleString()}</span></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Linked Resource</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            {advisory.messageId && (
              <p>Message: <span className="font-mono text-xs text-foreground">{advisory.messageId}</span></p>
            )}
            {advisory.momentId && (
              <p>Moment: <span className="font-mono text-xs text-foreground">{advisory.momentId}</span></p>
            )}
            {!advisory.messageId && !advisory.momentId && (
              <p>No linked resource</p>
            )}
          </CardContent>
        </Card>
      </div>

      {advisory.harmSignals && (
        <Card>
          <CardHeader><CardTitle>Harm Signals</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <SignalRow label="Violence" value={advisory.harmSignals.violence} />
            <SignalRow label="Harassment" value={advisory.harmSignals.harassment} />
            <SignalRow label="Threats" value={advisory.harmSignals.threats} />
            <SignalRow label="Hate speech" value={advisory.harmSignals.hateSpeech} />
          </CardContent>
        </Card>
      )}

      {advisory.spamIndicators && (
        <Card>
          <CardHeader><CardTitle>Spam Indicators</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <SignalRow label="Promotional" value={advisory.spamIndicators.promotional} />
            <SignalRow label="Repetitive" value={advisory.spamIndicators.repetitive} />
            <SignalRow label="Suspicious links" value={advisory.spamIndicators.links} />
            <SignalRow label="Financial fraud" value={advisory.spamIndicators.financialFraud} />
          </CardContent>
        </Card>
      )}

      {advisory.details && Object.keys(advisory.details).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Full Analysis</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted rounded p-3">
              {JSON.stringify(advisory.details, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
