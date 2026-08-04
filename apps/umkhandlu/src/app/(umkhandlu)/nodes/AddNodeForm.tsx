'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addNodeAction } from './actions';

export function AddNodeForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await addNodeAction(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>Register Node</Button>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-base">Register New Node</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Node Name</Label>
              <Input id="name" name="name" placeholder="Umkhandlu — Khathide Traditional Council" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="authority">Authority</Label>
              <Input id="authority" name="authority" placeholder="Khathide Traditional Council" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Nquthu, KwaZulu-Natal, South Africa" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contract_version">Contract Version</Label>
              <Input id="contract_version" name="contract_version" defaultValue="1.0" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="url">Node URL</Label>
              <Input id="url" name="url" type="url" placeholder="https://umkhandlu.unamifoundation.org" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input id="api_key" name="api_key" type="password" placeholder="Bearer key issued by node operator" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Optional notes about this node" rows={2} />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registering…' : 'Register Node'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
