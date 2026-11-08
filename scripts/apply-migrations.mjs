import { readFileSync } from 'fs';

const MGMT_TOKEN = 'sbp_ef6b486b8f8634f12f7630738463e367d085f49d';
const PROJECT_REF = 'ufsmpqxniswdnsywjzje';

const migrations = [
  'apps/umkhandlu/supabase/migrations/006_gis_datasets_pipelines.sql',
  'apps/umkhandlu/supabase/migrations/007_risk_compliance.sql',
];

for (const file of migrations) {
  const sql = readFileSync(file, 'utf8');
  console.log(`\nApplying: ${file}`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MGMT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${body.substring(0, 500)}`);
}
