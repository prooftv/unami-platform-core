#!/usr/bin/env node
/**
 * UNCIP D4 — Spatial Foundation migration
 *
 * Adds nullable lat/lng coordinate pairs to:
 *   - uncip_alerts (last_seen_lat, last_seen_lng)
 *   - uncip_alert_timeline (sighting_lat, sighting_lng)
 *   - uncip_schools (lat, lng)
 *   - uncip_saps_stations (lat, lng)
 *
 * Required env vars:
 *   NEXT_PUBLIC_UNCIP_SUPABASE_URL
 *   UNCIP_SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   NEXT_PUBLIC_UNCIP_SUPABASE_URL=https://tqragjtvcnsmumtaijds.supabase.co \
 *   UNCIP_SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
 *   node apps/uncip/scripts/migrate-d4.mjs
 */

const url    = process.env.NEXT_PUBLIC_UNCIP_SUPABASE_URL;
const svcKey = process.env.UNCIP_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !svcKey) {
  console.error('Missing NEXT_PUBLIC_UNCIP_SUPABASE_URL or UNCIP_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const steps = [
  {
    label: 'uncip_alerts: add last_seen_lat, last_seen_lng',
    sql: `ALTER TABLE uncip_alerts ADD COLUMN IF NOT EXISTS last_seen_lat NUMERIC, ADD COLUMN IF NOT EXISTS last_seen_lng NUMERIC`,
  },
  {
    label: 'uncip_alert_timeline: add sighting_lat, sighting_lng',
    sql: `ALTER TABLE uncip_alert_timeline ADD COLUMN IF NOT EXISTS sighting_lat NUMERIC, ADD COLUMN IF NOT EXISTS sighting_lng NUMERIC`,
  },
  {
    label: 'uncip_schools: add lat, lng',
    sql: `ALTER TABLE uncip_schools ADD COLUMN IF NOT EXISTS lat NUMERIC, ADD COLUMN IF NOT EXISTS lng NUMERIC`,
  },
  {
    label: 'uncip_saps_stations: add lat, lng',
    sql: `ALTER TABLE uncip_saps_stations ADD COLUMN IF NOT EXISTS lat NUMERIC, ADD COLUMN IF NOT EXISTS lng NUMERIC`,
  },
];

let ok = true;
for (const step of steps) {
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': svcKey,
      'Authorization': `Bearer ${svcKey}`,
    },
    body: JSON.stringify({ sql: step.sql }),
  });

  if (res.ok) {
    console.log(`✓ ${step.label}`);
  } else {
    const body = await res.text();
    if (body.includes('already exists')) {
      console.log(`✓ ${step.label} (already applied)`);
    } else {
      console.error(`✗ ${step.label}: ${body}`);
      ok = false;
    }
  }
}

if (!ok) {
  console.error('\nSome steps failed.');
  process.exit(1);
}
console.log('\nD4 migration complete.');
