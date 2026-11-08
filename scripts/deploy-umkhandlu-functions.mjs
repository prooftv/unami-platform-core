#!/usr/bin/env node
/**
 * deploy-umkhandlu-functions.mjs
 *
 * Deploys spatial-pipelines and spatial-scheduler Edge Functions
 * to ufsmpqxniswdnsywjzje (Umkhandlu Control Centre).
 *
 * Requires: SUPABASE_ACCESS_TOKEN in environment or .env.example
 * Usage: SUPABASE_ACCESS_TOKEN=<token> node scripts/deploy-umkhandlu-functions.mjs
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

function getAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  try {
    const env = readFileSync('/workspaces/unami-platform-core/.env.example', 'utf8');
    const match = env.match(/SUPABASE_ACCESS_TOKEN=(\S+)/);
    if (match) return match[1];
  } catch {}
  return null;
}

const token = getAccessToken();
const PROJECT_REF = 'ufsmpqxniswdnsywjzje';
const FUNCTIONS = ['spatial-pipelines', 'spatial-scheduler'];

if (!token) {
  console.error('No SUPABASE_ACCESS_TOKEN found. Refresh at supabase.com → Account → Access Tokens.');
  process.exit(1);
}

console.log('Deploying Edge Functions to', PROJECT_REF);
console.log('Token:', token.slice(0, 12) + '...');

for (const fn of FUNCTIONS) {
  console.log(`\nDeploying ${fn}...`);
  try {
    execSync(
      `npx supabase functions deploy ${fn} --project-ref ${PROJECT_REF}`,
      {
        cwd: '/workspaces/unami-platform-core',
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
        stdio: 'inherit',
      }
    );
    console.log(`✓ ${fn} deployed`);
  } catch (e) {
    console.error(`✗ ${fn} failed:`, e.message);
  }
}

console.log('\nDone. Verify at: https://supabase.com/dashboard/project/' + PROJECT_REF + '/functions');
