/**
 * D4 verification — confirms spatial columns exist and are accepted by Edge Functions
 */
const UNCIP_URL  = 'https://tqragjtvcnsmumtaijds.supabase.co';
const ANON_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcmFnanR2Y25zbXVtdGFpamRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NzkyNjIsImV4cCI6MjEwMjA1NTI2Mn0.wqXB1IPtE25weceSAD24a7OXr5FDK8gpTd8K1SayOCI';
const SVC_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcmFnanR2Y25zbXVtdGFpamRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQ3OTI2MiwiZXhwIjoyMTAyMDU1MjYyfQ.y2Ge273W1otAFK3VRrPHDwDrZV8uE-8WMzP2dsM3Tds';
const FN_BASE    = `${UNCIP_URL}/functions/v1`;

import { createClient } from '@supabase/supabase-js';
const svc = createClient(UNCIP_URL, SVC_KEY);

// 1. Sign in as parent pilot account
const { data: authData, error: authErr } = await svc.auth.signInWithPassword({
  email: 'parent@uncip.test', password: 'Pilot2026!'
});
if (authErr) { console.error('Auth failed:', authErr.message); process.exit(1); }
const token = authData.session.access_token;
console.log('✓ Authenticated as parent@uncip.test');

const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

// 2. Get a child the parent owns
const childRes = await fetch(`${FN_BASE}/uncip-children`, { headers });
const { data: children } = await childRes.json();
if (!children?.length) { console.error('No children found'); process.exit(1); }
const child = children[0];
console.log(`✓ Found child: ${child.first_name} ${child.last_name}`);

// 3. Create alert WITH coordinates
const alertRes = await fetch(`${FN_BASE}/uncip-alerts`, {
  method: 'POST', headers,
  body: JSON.stringify({
    child_id: child.id,
    alert_type: 'missing',
    description: 'D4 verification test — spatial coordinates round-trip check.',
    last_seen_at: new Date().toISOString(),
    last_seen_location: 'Near Soweto Primary, soccer field',
    last_seen_lat: -26.2485,
    last_seen_lng: 27.8546,
    contact_phone: '+27820000001',
  }),
});
const alertBody = await alertRes.json();
if (!alertRes.ok) { console.error('Alert create failed:', JSON.stringify(alertBody)); process.exit(1); }
const alert = alertBody.data;
console.log(`✓ Alert created: ${alert.id}`);
console.log(`  last_seen_lat: ${alert.last_seen_lat}  last_seen_lng: ${alert.last_seen_lng}`);
if (alert.last_seen_lat !== -26.2485 || alert.last_seen_lng !== 27.8546) {
  console.error('✗ Coordinates not persisted correctly'); process.exit(1);
}
console.log('✓ Alert coordinates persisted correctly');

// 4. Sign in as community and report sighting WITH coordinates
const { data: commAuth } = await svc.auth.signInWithPassword({
  email: 'community@uncip.test', password: 'Pilot2026!'
});
const commToken = commAuth.session.access_token;
const commHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${commToken}` };

const tlRes = await fetch(`${FN_BASE}/uncip-timeline`, {
  method: 'POST', headers: commHeaders,
  body: JSON.stringify({
    alert_id: alert.id,
    action: 'community_sighting_reported',
    sighting_location: 'Corner of Vilakazi and Moema',
    sighting_lat: -26.2510,
    sighting_lng: 27.8560,
    note: 'D4 sighting coordinate test',
  }),
});
const tlBody = await tlRes.json();
if (!tlRes.ok) { console.error('Timeline failed:', JSON.stringify(tlBody)); process.exit(1); }
const entry = tlBody.data;
console.log(`✓ Sighting timeline entry: ${entry.id}`);
console.log(`  sighting_lat: ${entry.sighting_lat}  sighting_lng: ${entry.sighting_lng}`);
if (entry.sighting_lat !== -26.251 || entry.sighting_lng !== 27.856) {
  console.error('✗ Sighting coordinates not persisted correctly'); process.exit(1);
}
console.log('✓ Sighting coordinates persisted correctly');

// 5. Verify community cannot see child_id on alert list
const mapRes = await fetch(`${FN_BASE}/uncip-alerts?status=active`, { headers: commHeaders });
const mapBody = await mapRes.json();
const testAlert = mapBody.data?.find(a => a.id === alert.id);
if (testAlert?.child_id) {
  console.error('✗ Community can see child_id — privacy boundary broken'); process.exit(1);
}
console.log('✓ Community projection: child_id correctly stripped');

// 6. Clean up — cancel the test alert
const parentHeaders = headers;
await fetch(`${FN_BASE}/uncip-alerts/${alert.id}/status`, {
  method: 'PATCH', headers: parentHeaders,
  body: JSON.stringify({ status: 'cancelled', note: 'D4 verification cleanup' }),
});
console.log('✓ Test alert cancelled');

console.log('\n✅ D4 verification complete — spatial foundation confirmed end-to-end');
