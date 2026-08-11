import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_NEXT_PATHS = /^\/[a-zA-Z0-9\-_/]*$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = request.nextUrl.origin;
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/dashboard';
  const next = ALLOWED_NEXT_PATHS.test(rawNext) ? rawNext : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Auth+callback+failed`);
}
