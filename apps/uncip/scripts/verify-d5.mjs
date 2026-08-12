#!/usr/bin/env node
/**
 * D5 verification — confirms media upload, signed URL, and privacy boundaries.
 */
import { createClient } from '@supabase/supabase-js';

const UNCIP_URL = 'https://tqragjtvcnsmumtaijds.supabase.co';
const SVC_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcmFnanR2Y25zbXVtdGFpamRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQ3OTI2MiwiZXhwIjoyMTAyMDU1MjYyfQ.y2Ge273W1otAFK3VRrPHDwDrZV8uE-8WMzP2dsM3Tds';
const FN_BASE   = `${UNCIP_URL}/functions/v1`;

const svc = createClient(UNCIP_URL, SVC_KEY);

// ── Auth ──────────────────────────────────────────────────────────────────────
const { data: parentAuth } = await svc.auth.signInWithPassword({ email: 'parent@uncip.test', password: 'Pilot2026!' });
const parentToken = parentAuth.session.access_token;
const parentHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${parentToken}` };

const { data: commAuth } = await svc.auth.signInWithPassword({ email: 'community@uncip.test', password: 'Pilot2026!' });
const commToken = commAuth.session.access_token;
const commHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${commToken}` };

console.log('✓ Authenticated parent + community');

// ── Create a test alert ───────────────────────────────────────────────────────
const childRes = await fetch(`${FN_BASE}/uncip-children`, { headers: parentHeaders });
const { data: children } = await childRes.json();
const child = children[0];

const alertRes = await fetch(`${FN_BASE}/uncip-alerts`, {
  method: 'POST', headers: parentHeaders,
  body: JSON.stringify({
    child_id: child.id, alert_type: 'missing',
    description: 'D5 verification test — media layer check.',
    last_seen_at: new Date().toISOString(),
    last_seen_location: 'Test location', contact_phone: '+27820000001',
  }),
});
const { data: alert } = await alertRes.json();
console.log(`✓ Alert created: ${alert.id}`);

// ── 1. Parent requests alert-level upload URL ─────────────────────────────────
const uploadReqRes = await fetch(`${FN_BASE}/uncip-media/upload`, {
  method: 'POST', headers: parentHeaders,
  body: JSON.stringify({
    scope: 'alert', alert_id: alert.id,
    mime_type: 'image/jpeg', file_size: 1024, label: 'Test attachment',
  }),
});
const uploadReqBody = await uploadReqRes.json();
if (!uploadReqRes.ok) { console.error('✗ Upload request failed:', JSON.stringify(uploadReqBody)); process.exit(1); }
const { media_id, upload_url, path: storagePath } = uploadReqBody.data;
console.log(`✓ Alert upload URL obtained: media_id=${media_id}`);

// ── 2. PUT a tiny JPEG to the signed upload URL ───────────────────────────────
// Minimal valid JPEG (1x1 pixel)
const tinyJpeg = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=',
  'base64',
);
const putRes = await fetch(upload_url, {
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' },
  body: tinyJpeg,
});
if (!putRes.ok) { console.error('✗ PUT to signed URL failed:', putRes.status); process.exit(1); }
console.log('✓ File uploaded to storage via signed URL');

// ── 3. Get signed read URL ────────────────────────────────────────────────────
const signedRes = await fetch(
  `${FN_BASE}/uncip-media/signed?path=${encodeURIComponent(storagePath)}&bucket=alert-media`,
  { headers: parentHeaders },
);
const signedBody = await signedRes.json();
if (!signedRes.ok) { console.error('✗ Signed read URL failed:', JSON.stringify(signedBody)); process.exit(1); }
console.log(`✓ Signed read URL obtained (expires_in: ${signedBody.data.expires_in}s)`);
if (signedBody.data.expires_in !== 3600) { console.error('✗ TTL is not 1 hour'); process.exit(1); }
console.log('✓ TTL is 1 hour (3600s)');

// ── 4. List alert media ───────────────────────────────────────────────────────
const listRes = await fetch(`${FN_BASE}/uncip-media/alert/${alert.id}`, { headers: parentHeaders });
const listBody = await listRes.json();
if (!listRes.ok || !listBody.data?.length) { console.error('✗ List alert media failed'); process.exit(1); }
console.log(`✓ Alert media list: ${listBody.data.length} item(s)`);

// ── 5. Community cannot upload alert-level media ──────────────────────────────
const commUploadRes = await fetch(`${FN_BASE}/uncip-media/upload`, {
  method: 'POST', headers: commHeaders,
  body: JSON.stringify({
    scope: 'alert', alert_id: alert.id,
    mime_type: 'image/jpeg', file_size: 1024,
  }),
});
if (commUploadRes.status !== 403) {
  console.error('✗ Community should be forbidden from alert-level upload'); process.exit(1);
}
console.log('✓ Community correctly blocked from alert-level upload (403)');

// ── 6. Community sighting + timeline media ────────────────────────────────────
const tlRes = await fetch(`${FN_BASE}/uncip-timeline`, {
  method: 'POST', headers: commHeaders,
  body: JSON.stringify({
    alert_id: alert.id, action: 'community_sighting_reported',
    sighting_location: 'Test sighting', note: 'D5 timeline media test',
  }),
});
const { data: tlEntry } = await tlRes.json();
console.log(`✓ Sighting timeline entry: ${tlEntry.id}`);

const tlUploadRes = await fetch(`${FN_BASE}/uncip-media/upload`, {
  method: 'POST', headers: commHeaders,
  body: JSON.stringify({
    scope: 'timeline', alert_id: alert.id,
    timeline_entry_id: tlEntry.id,
    mime_type: 'image/jpeg', file_size: 1024, label: 'Sighting photo',
  }),
});
const tlUploadBody = await tlUploadRes.json();
if (!tlUploadRes.ok) { console.error('✗ Community timeline upload failed:', JSON.stringify(tlUploadBody)); process.exit(1); }
console.log(`✓ Community timeline upload URL obtained`);

// ── 7. Community cannot attach to school/authority entries ────────────────────
// Sign in as school and create a confirmation entry
const { data: schoolAuth } = await svc.auth.signInWithPassword({ email: 'school@uncip.test', password: 'Pilot2026!' });
const schoolHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${schoolAuth.session.access_token}` };

const schoolTlRes = await fetch(`${FN_BASE}/uncip-timeline`, {
  method: 'POST', headers: schoolHeaders,
  body: JSON.stringify({ alert_id: alert.id, action: 'school_confirmed_last_seen', note: 'D5 test' }),
});
const { data: schoolEntry } = await schoolTlRes.json();

// Community tries to attach to school's entry
const commTlUploadRes = await fetch(`${FN_BASE}/uncip-media/upload`, {
  method: 'POST', headers: commHeaders,
  body: JSON.stringify({
    scope: 'timeline', alert_id: alert.id,
    timeline_entry_id: schoolEntry.id,
    mime_type: 'image/jpeg', file_size: 1024,
  }),
});
if (commTlUploadRes.status !== 403) {
  console.error('✗ Community should be forbidden from attaching to school entry'); process.exit(1);
}
console.log('✓ Community correctly blocked from attaching to school timeline entry (403)');

// ── 8. Clean up ───────────────────────────────────────────────────────────────
await fetch(`${FN_BASE}/uncip-alerts/${alert.id}/status`, {
  method: 'PATCH', headers: parentHeaders,
  body: JSON.stringify({ status: 'cancelled', note: 'D5 verification cleanup' }),
});
console.log('✓ Test alert cancelled');

console.log('\n✅ D5 verification complete — media layer confirmed end-to-end');
