#!/usr/bin/env node
/**
 * Apply one reviewed migration through the Supabase Management API.
 *
 * Usage:
 *   SUPABASE_PROJECT_REF=<project-ref> SUPABASE_ACCESS_TOKEN=<token> \
 *     node scripts/apply-migrations-direct.mjs <migration-file>
 */

import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRef = process.env.SUPABASE_PROJECT_REF;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const migrationName = process.argv[2];
const migrationsDirectory = fileURLToPath(
  new URL('../apps/umkhandlu/supabase/migrations/', import.meta.url),
);

if (!projectRef || !accessToken || !migrationName) {
  console.error(
    'Set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN, then pass one migration filename.',
  );
  process.exit(1);
}

const migrationPath = resolve(migrationsDirectory, migrationName);
const relativeMigrationPath = relative(migrationsDirectory, migrationPath);
if (
  isAbsolute(relativeMigrationPath) ||
  relativeMigrationPath === '..' ||
  relativeMigrationPath.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)
) {
  console.error('Migration must be inside the Control Centre migration directory.');
  process.exit(1);
}

let sql;
try {
  sql = readFileSync(migrationPath, 'utf8');
} catch (error) {
  console.error(
    `Could not read migration: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}

const response = await fetch(
  `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/database/query`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: sql }),
  },
);

if (!response.ok) {
  const detail = (await response.text()).slice(0, 300);
  console.error(`Migration failed with HTTP ${response.status}: ${detail}`);
  process.exit(1);
}

console.log(`Applied migration ${migrationName} to project ${projectRef}.`);
