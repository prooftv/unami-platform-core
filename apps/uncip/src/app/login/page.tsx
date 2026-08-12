import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_CONFIG } from '@/config/app-config';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 rounded-lg border border-border bg-card">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">{APP_CONFIG.name}</h1>
            <p className="text-sm text-muted-foreground">{APP_CONFIG.subtitle}</p>
          </div>
        </div>

        <LoginForm searchParams={searchParams} />

        <p className="text-center text-xs text-muted-foreground">
          Parent?{' '}
          <a href="/register" className="underline underline-offset-4 hover:text-foreground">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const { error, registered } = await searchParams;

  return (
    <form action="/auth/login" method="POST" className="space-y-4">
      {registered && (
        <p className="text-sm text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300 px-3 py-2 rounded-md">
          Account created. Check your email to confirm, then sign in.
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
