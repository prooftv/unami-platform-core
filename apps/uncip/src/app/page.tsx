import { redirect } from 'next/navigation';

export default function Root() {
  // Foundation phase: mock session is always present, always redirect to dashboard.
  // Auth phase: check Supabase session here and redirect to /login if absent.
  redirect('/dashboard');
}
