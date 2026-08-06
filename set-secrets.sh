#!/bin/bash
# set-secrets.sh — Set all Edge Function secrets for Moments v2
#
# Usage:
#   SUPABASE_ACCESS_TOKEN=<your_token> \
#   WHATSAPP_TOKEN=<regenerated_from_meta> \
#   WEBHOOK_HMAC_SECRET=<your_generated_secret> \
#   SANITY_REVALIDATE_SECRET=<your_generated_secret> \
#   ./set-secrets.sh
#
# WHATSAPP_TOKEN:        Regenerate at https://developers.facebook.com → your app → WhatsApp → API Setup
# WEBHOOK_HMAC_SECRET:   Generate with: openssl rand -hex 32
# SANITY_REVALIDATE_SECRET: Generate with: openssl rand -hex 32

set -e

PROJECT_REF="dpydmpydyfrrdhuezvgi"

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN is not set."
  exit 1
fi

if [ -z "$WHATSAPP_TOKEN" ]; then
  echo "ERROR: WHATSAPP_TOKEN is not set. Regenerate from Meta Business Manager."
  exit 1
fi

if [ -z "$WEBHOOK_HMAC_SECRET" ]; then
  echo "ERROR: WEBHOOK_HMAC_SECRET is not set. Generate with: openssl rand -hex 32"
  exit 1
fi

echo ""
echo "=== Setting Edge Function Secrets ==="
echo "Project: ${PROJECT_REF}"
echo ""

npx supabase secrets set \
  SUPABASE_URL="https://dpydmpydyfrrdhuezvgi.supabase.co" \
  SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweWRtcHlkeWZycmRodWV6dmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MDI5MjEsImV4cCI6MjEwMDk3ODkyMX0.h6_1ZobiwIS0nWigDsYnl6abOevG-IVl7zEe9cM6VDE" \
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweWRtcHlkeWZycmRodWV6dmdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQwMjkyMSwiZXhwIjoyMTAwOTc4OTIxfQ.pkDlIgqKpIBlKOB9KOhkNxCfD5nwMuHoxGOZ1J1ntoo" \
  ADMIN_URL="https://admin.moments.unamifoundation.org" \
  WEB_URL="https://moments.unamifoundation.org" \
  WHATSAPP_TOKEN="$WHATSAPP_TOKEN" \
  WHATSAPP_PHONE_NUMBER_ID="940140815849209" \
  WEBHOOK_VERIFY_TOKEN="whatsapp_gateway_verify_2024_secure" \
  WEBHOOK_HMAC_SECRET="$WEBHOOK_HMAC_SECRET" \
  WHATSAPP_DEFAULT_TEMPLATE="moment_broadcast" \
  --project-ref "$PROJECT_REF"

echo ""
echo "✓ Secrets set"
echo ""
echo "Verify in Supabase dashboard → Edge Functions → Manage secrets"
