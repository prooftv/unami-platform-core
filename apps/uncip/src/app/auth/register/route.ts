import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { UNCIP_ENV } from '@/lib/env';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;

  try {
    const formData = await request.formData();
    const email    = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const name     = String(formData.get('name') ?? '').trim() || null;

    if (!email || !password) {
      return NextResponse.redirect(
        `${origin}/register?error=${encodeURIComponent('Email and password are required')}`,
        { status: 303 },
      );
    }

    if (password.length < 8) {
      return NextResponse.redirect(
        `${origin}/register?error=${encodeURIComponent('Password must be at least 8 characters')}`,
        { status: 303 },
      );
    }

    const response = NextResponse.redirect(`${origin}/login?registered=1`, { status: 303 });

    // Sign up via anon client so the auth cookie is set correctly
    const supabase = createServerClient(
      UNCIP_ENV.supabaseUrl,
      UNCIP_ENV.supabaseAnonKey,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    if (signUpError || !data.user) {
      return NextResponse.redirect(
        `${origin}/register?error=${encodeURIComponent(signUpError?.message ?? 'Registration failed')}`,
        { status: 303 },
      );
    }

    // Role is ALWAYS 'parent' — never accepted from the form
    const svc = createServiceClient();
    const { error: profileError } = await svc
      .from('uncip_user_profiles')
      .insert({
        id:        data.user.id,
        email,
        name,
        role:      'parent',
        is_active: true,
      });

    if (profileError) {
      // Profile insert failed — clean up the auth user so the state is consistent
      await svc.auth.admin.deleteUser(data.user.id);
      return NextResponse.redirect(
        `${origin}/register?error=${encodeURIComponent('Account creation failed. Please try again.')}`,
        { status: 303 },
      );
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.redirect(
      `${origin}/register?error=${encodeURIComponent(message)}`,
      { status: 303 },
    );
  }
}
