import { Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_CONFIG } from '@/config/app-config';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 rounded-lg border border-border bg-card">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">{APP_CONFIG.name}</h1>
            <p className="text-sm text-muted-foreground">Create a parent account</p>
          </div>
        </div>

        <form action="/auth/register" method="POST" className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {decodeURIComponent(error)}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name (optional)</Label>
            <Input id="name" name="name" type="text" autoComplete="name" placeholder="e.g. Thabo Nkosi" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
            <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
          </div>

          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
