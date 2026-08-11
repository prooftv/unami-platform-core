/**
 * UNCIP environment configuration.
 *
 * Throws at module load time if required variables are absent.
 * This is intentional — UNCIP must never silently connect to another
 * Supabase project (e.g. Moments) due to missing configuration.
 *
 * If this throws in production, the deployment is misconfigured.
 * Fix the environment variables, not this file.
 */

function require(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[UNCIP] Missing required environment variable: ${name}\n` +
      `UNCIP uses its own Supabase project. Do not use Moments credentials here.\n` +
      `Set ${name} in your Vercel project environment variables.`
    );
  }
  return value;
}

export const UNCIP_ENV = {
  supabaseUrl:    require('NEXT_PUBLIC_UNCIP_SUPABASE_URL'),
  supabaseAnonKey: require('NEXT_PUBLIC_UNCIP_SUPABASE_ANON_KEY'),
} as const;
