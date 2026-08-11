import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">The page you are looking for does not exist.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
