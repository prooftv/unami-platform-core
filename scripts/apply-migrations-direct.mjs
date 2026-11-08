#!/usr/bin/env node
/**
 * apply-migrations-direct.mjs
 *
 * Applies SQL migrations to ufsmpqxniswdnsywjzje using the Supabase
 * Management API (requires SUPABASE_ACCESS_TOKEN) or falls back to
 * direct PostgREST RPC if exec_sql exists.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<token> node scripts/apply-migrations-direct.mjs
 *
 * If no token: reads from .env.example automatically.
 */

import { readFileSync } from 'fs';

const PROJECT_REF = 'ufsmpqxniswdnsywjzje';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmc21wcXhuaXN3ZG5zeXdqemplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTg1MTUyNiwiZXhwIjoyMTAxNDI3NTI2fQ.yqdgbMNuqU3qwuXlgbl5yGcIbgxDCOHnUi0WZ8k8eo8';

// Read access token from env or .env.example
function getAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  try {
    const env = readFileSync('/workspaces/unami-platform-core/.env.example', 'utf8');
    const match = env.match(/SUPABASE_ACCESS_TOKEN=(\S+)/);
    if (match) return match[1];
  } catch {}
  return null;
}

const ACCESS_TOKEN = getAccessToken();

async function execViaManagementAPI(sql) {
  if (!ACCESS_TOKEN) return { ok: false, error: 'No SUPABASE_ACCESS_TOKEN' };
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const body = await res.text();
  if (res.ok) return { ok: true };
  return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 300)}` };
}

async function execViaRPC(sql) {
  const res = await fetch(
    `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ sql }),
    }
  );
  const body = await res.text();
  if (res.ok) return { ok: true };
  return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 300)}` };
}

async function execSQL(sql, label) {
  // Try Management API first
  let result = await execViaManagementAPI(sql);
  if (result.ok) { console.log(`  ✓ ${label}`); return true; }

  // If management API fails with auth error, try RPC
  if (result.error.includes('401') || result.error.includes('No SUPABASE_ACCESS_TOKEN')) {
    result = await execViaRPC(sql);
    if (result.ok) { console.log(`  ✓ ${label} (via RPC)`); return true; }
  }

  console.error(`  ✗ ${label}`);
  console.error(`    ${result.error}`);
  return false;
}

function splitStatements(sql) {
  // Split on semicolons followed by newline, preserve DO $$ blocks
  const statements = [];
  let current = '';
  let inDollarQuote = false;

  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue;

    if (trimmed.includes('$$')) inDollarQuote = !inDollarQuote;

    current += line + '\n';

    if (!inDollarQuote && trimmed.endsWith(';')) {
      const stmt = current.trim().replace(/;$/, '');
      if (stmt.length > 0) statements.push(stmt);
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements.filter(s => s.length > 0);
}

async function runMigration(filePath, label) {
  console.log(`\n── ${label}`);
  let sql;
  try {
    sql = readFileSync(filePath, 'utf8');
  } catch (e) {
    console.error(`  File not found: ${filePath}`);
    return false;
  }

  const statements = splitStatements(sql);
  console.log(`   ${statements.length} statements`);

  let ok = 0, fail = 0;
  for (const stmt of statements) {
    const preview = stmt.replace(/\n/g, ' ').slice(0, 70);
    const success = await execSQL(stmt, preview);
    if (success) ok++; else fail++;
  }
  console.log(`   Result: ${ok} ok, ${fail} failed`);
  return fail === 0;
}

const base = '/workspaces/unami-platform-core/apps/umkhandlu/supabase/migrations';

console.log('Umkhandlu Migration Runner');
console.log('Project:', PROJECT_REF);
console.log('Access token:', ACCESS_TOKEN ? ACCESS_TOKEN.slice(0, 12) + '...' : 'NOT FOUND');

const migrations = [
  [`${base}/005_spatial_sources_grant_fix.sql`, '005-fix: GRANTs + COGTA source catalogue'],
  [`${base}/006_gis_datasets_pipelines.sql`,    '006: spatial_datasets, pipeline_runs, staged_features'],
  [`${base}/007_risk_compliance.sql`,            '007: risk, compliance, controls, evidence, findings, audit'],
];

let allOk = true;
for (const [path, label] of migrations) {
  const ok = await runMigration(path, label);
  if (!ok) allOk = false;
}

console.log(allOk
  ? '\n✅ All migrations applied successfully.'
  : '\n⚠️  Some statements failed. If SUPABASE_ACCESS_TOKEN is expired, refresh at supabase.com → Account → Access Tokens and re-run.'
);
