#!/bin/bash
# deploy.sh — Moments v2 full deployment
# Applies all pending migrations and deploys all Edge Functions.
#
# Usage:
#   SUPABASE_ACCESS_TOKEN=<your_token> DB_PASSWORD=<your_db_password> ./deploy.sh
#
# Get your access token from: https://supabase.com/dashboard/account/tokens
# Get your DB password from:  Supabase dashboard → Settings → Database → Connection string

set -e

PROJECT_REF="dpydmpydyfrrdhuezvgi"
DB_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN is not set."
  echo "Get a token from https://supabase.com/dashboard/account/tokens"
  exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
  echo "ERROR: DB_PASSWORD is not set."
  echo "Get it from Supabase dashboard → Settings → Database → Connection string"
  exit 1
fi

echo ""
echo "=== Moments v2 Deployment ==="
echo "Project: ${PROJECT_REF}"
echo ""

# ── Step 1: Link project ──────────────────────────────────────────────────────
echo "→ Linking project..."
npx supabase link --project-ref "$PROJECT_REF" --password "$DB_PASSWORD"
echo "✓ Linked"

# ── Step 2: Apply migrations ──────────────────────────────────────────────────
echo ""
echo "→ Applying migrations..."
npx supabase db push --db-url "$DB_URL"
echo "✓ Migrations applied"

# ── Step 3: Deploy all Edge Functions ─────────────────────────────────────────
# All functions use --no-verify-jwt because they handle their own auth internally
# via requireAuth() in _shared/auth.ts. Public routes use the anon key directly.
echo ""
echo "→ Deploying Edge Functions..."

FUNCTIONS=(
  "analytics"
  "auth"
  "authority"
  "broadcast"
  "broadcasts"
  "campaigns"
  "evidence"
  "media"
  "moderation"
  "moments"
  "notices"
  "participation"
  "records"
  "retry-batches"
  "settings"
  "sponsors"
  "subscribers"
  "user-profiles"
  "webhook"
)

for fn in "${FUNCTIONS[@]}"; do
  echo "  deploying: $fn"
  npx supabase functions deploy "$fn" --project-ref "$PROJECT_REF" --no-verify-jwt
  if [ $? -ne 0 ]; then
    echo "  FAILED: $fn — check output above"
  else
    echo "  ✓ $fn"
  fi
done

echo ""
echo "✓ All Edge Functions deployed"
echo ""
echo "=== Deployment complete ==="
echo ""
echo "Next steps:"
echo "  1. Set Edge Function secrets in Supabase dashboard → Edge Functions → Manage secrets"
echo "  2. Create storage buckets: evidence (public), moments-media (public)"
echo "  3. Set participation_webhook_url in system_settings table"
echo "  4. Verify all functions show green in Supabase dashboard"
