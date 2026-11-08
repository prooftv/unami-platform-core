/**
 * apply-umkhandlu-migrations.mjs
 *
 * Applies pending migrations to ufsmpqxniswdnsywjzje using the service role key.
 * Uses Supabase REST API with raw SQL via the pg_dump-compatible endpoint.
 *
 * Run: node scripts/apply-umkhandlu-migrations.mjs
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ufsmpqxniswdnsywjzje.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmc21wcXhuaXN3ZG5zeXdqemplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTg1MTUyNiwiZXhwIjoyMTAxNDI3NTI2fQ.yqdgbMNuqU3qwuXlgbl5yGcIbgxDCOHnUi0WZ8k8eo8';

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

/**
 * Execute a single SQL statement via Supabase RPC.
 * We use the pg_net / raw query approach via a stored procedure if available,
 * otherwise fall back to the Management API.
 */
async function execSQL(sql, label) {
  // Try via rpc exec_sql first (may not exist)
  const { error } = await sb.rpc('exec_sql', { sql });
  if (!error) {
    console.log(`  ✓ ${label}`);
    return true;
  }

  // exec_sql doesn't exist — use Management API
  const res = await fetch(
    `https://api.supabase.com/v1/projects/ufsmpqxniswdnsywjzje/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (res.ok) {
    console.log(`  ✓ ${label}`);
    return true;
  }

  const body = await res.text();
  console.error(`  ✗ ${label}: HTTP ${res.status} — ${body.slice(0, 200)}`);
  return false;
}

/**
 * Split a SQL file into individual statements, skipping comments and blanks.
 */
function splitStatements(sql) {
  return sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
}

async function runMigration(filePath, label) {
  console.log(`\n── ${label}`);
  const sql = readFileSync(filePath, 'utf8');
  const statements = splitStatements(sql);
  console.log(`   ${statements.length} statements`);

  let ok = 0;
  let fail = 0;
  for (const stmt of statements) {
    const preview = stmt.slice(0, 60).replace(/\n/g, ' ');
    const success = await execSQL(stmt + ';', preview);
    if (success) ok++; else fail++;
  }
  console.log(`   ${ok} ok, ${fail} failed`);
  return fail === 0;
}

const base = '/workspaces/unami-platform-core/apps/umkhandlu/supabase/migrations';

const migrations = [
  [`${base}/005_spatial_sources_grant_fix.sql`, '005-fix: GRANT service_role on spatial tables'],
  [`${base}/006_gis_datasets_pipelines.sql`,    '006: spatial_datasets, pipeline_runs, staged_features'],
  [`${base}/007_risk_compliance.sql`,            '007: risk, compliance, controls, evidence, findings, audit'],
];

let allOk = true;
for (const [path, label] of migrations) {
  const ok = await runMigration(path, label);
  if (!ok) allOk = false;
}

console.log(allOk ? '\n✅ All migrations applied.' : '\n⚠️  Some statements failed — check output above.');
