import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { UNCIP_ENV } from '@/lib/env';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email    = formData.get('email') as string;
  const password = formData.get('password') as string;
  const origin   = request.nextUrl.origin;

  const response = NextResponse.redirect(`${origin}/dashboard`, { status: 303 });

  const supabase = createServerClient(
    UNCIP_ENV.supabaseUrl,
    UNCIP_ENV.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
      { status: 303 },
    );
  }

  return response;
}
