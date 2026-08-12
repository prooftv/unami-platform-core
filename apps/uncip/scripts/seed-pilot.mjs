#!/usr/bin/env node
/**
 * UNCIP C5 — Pilot seed data
 *
 * Creates the minimum data required to verify all five role experiences
 * in a live environment. Safe to re-run: existing records are skipped.
 *
 * Required env vars:
 *   NEXT_PUBLIC_UNCIP_SUPABASE_URL
 *   UNCIP_SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node apps/uncip/scripts/seed-pilot.mjs
 *
 * All passwords: Pilot2026!
 * All accounts are synthetic test data — do NOT use in production with real children.
 */

import { createClient } from '@supabase/supabase-js';

const url     = process.env.NEXT_PUBLIC_UNCIP_SUPABASE_URL;
const svcKey  = process.env.UNCIP_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !svcKey) {
  console.error('Missing NEXT_PUBLIC_UNCIP_SUPABASE_URL or UNCIP_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, svcKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = 'Pilot2026!';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function upsertStation(name, province, district) {
  const { data: existing } = await supabase
    .from('uncip_saps_stations')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (existing) { console.log(`  skip station: ${name}`); return existing.id; }

  const { data, error } = await supabase
    .from('uncip_saps_stations')
    .insert({ name, province, district })
    .select('id')
    .single();
  if (error) throw new Error(`station ${name}: ${error.message}`);
  console.log(`  created station: ${name}`);
  return data.id;
}

async function upsertSchool(name, province, address, stationId) {
  const { data: existing } = await supabase
    .from('uncip_schools')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (existing) { console.log(`  skip school: ${name}`); return existing.id; }

  const { data, error } = await supabase
    .from('uncip_schools')
    .insert({ name, province, address, station_id: stationId })
    .select('id')
    .single();
  if (error) throw new Error(`school ${name}: ${error.message}`);
  console.log(`  created school: ${name}`);
  return data.id;
}

async function upsertUser(email, name, role, { stationId = null, schoolId = null } = {}) {
  // Check profile first (profile exists iff auth user + profile both exist)
  const { data: existing } = await supabase
    .from('uncip_user_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) { console.log(`  skip user: ${email}`); return existing.id; }

  // Create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,   // skip confirmation email for test accounts
  });
  if (error) throw new Error(`auth user ${email}: ${error.message}`);
  const userId = data.user.id;

  // Create profile — role is always server-controlled
  const { error: profileError } = await supabase
    .from('uncip_user_profiles')
    .insert({
      id:         userId,
      email,
      name,
      role,
      station_id: stationId,
      school_id:  schoolId,
      is_active:  true,
    });
  if (profileError) throw new Error(`profile ${email}: ${profileError.message}`);
  console.log(`  created user: ${email} (${role})`);
  return userId;
}

async function upsertChild(firstName, lastName, dob, gender, schoolId, createdBy) {
  const { data: existing } = await supabase
    .from('uncip_children')
    .select('id')
    .eq('first_name', firstName)
    .eq('last_name', lastName)
    .eq('created_by', createdBy)
    .maybeSingle();
  if (existing) { console.log(`  skip child: ${firstName} ${lastName}`); return existing.id; }

  const { data, error } = await supabase
    .from('uncip_children')
    .insert({
      first_name:    firstName,
      last_name:     lastName,
      date_of_birth: dob,
      gender,
      school_id:     schoolId,
      created_by:    createdBy,
    })
    .select('id')
    .single();
  if (error) throw new Error(`child ${firstName} ${lastName}: ${error.message}`);
  console.log(`  created child: ${firstName} ${lastName}`);
  return data.id;
}

async function upsertGuardianLink(childId, userId, relationship, isPrimary) {
  const { data: existing } = await supabase
    .from('uncip_guardian_links')
    .select('id')
    .eq('child_id', childId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) { console.log(`  skip guardian link`); return; }

  const { error } = await supabase
    .from('uncip_guardian_links')
    .insert({ child_id: childId, user_id: userId, relationship, is_primary: isPrimary });
  if (error) throw new Error(`guardian link: ${error.message}`);
  console.log(`  created guardian link`);
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

console.log('\nUNCIP pilot seed — starting\n');

// Stations
console.log('Stations:');
const sowetoStationId      = await upsertStation('Soweto SAPS Station',      'gauteng',      'Soweto');
const khayelitshaStationId = await upsertStation('Khayelitsha SAPS Station', 'western_cape', 'Khayelitsha');

// Schools
console.log('\nSchools:');
const sowetoPrimaryId    = await upsertSchool('Soweto Primary School',      'gauteng',      '1 Vilakazi Street, Soweto',          sowetoStationId);
const orlandoWestId      = await upsertSchool('Orlando West Primary',        'gauteng',      '12 Orlando West, Soweto',            sowetoStationId);
const meadowlandsId      = await upsertSchool('Meadowlands Primary',         'gauteng',      '5 Meadowlands Zone 6, Soweto',       sowetoStationId);
const khayelitshaPrimId  = await upsertSchool('Khayelitsha Primary School',  'western_cape', '3 Mew Way, Khayelitsha',             khayelitshaStationId);
const siteBPrimaryId     = await upsertSchool('Site B Primary School',       'western_cape', '7 Site B, Khayelitsha',              khayelitshaStationId);

// Suppress unused variable warnings — schools exist for RLS coverage
void orlandoWestId; void meadowlandsId; void khayelitshaPrimId; void siteBPrimaryId;

// Users
console.log('\nUsers:');
const adminId     = await upsertUser('admin@uncip.test',     'UNCIP Admin',        'admin');
const parentId    = await upsertUser('parent@uncip.test',    'Nomsa Dlamini',      'parent');
const schoolId    = await upsertUser('school@uncip.test',    'Thabo Mokoena',      'school',     { schoolId: sowetoPrimaryId });
const authorityId = await upsertUser('authority@uncip.test', 'Sgt. Sipho Nkosi',  'authority',  { stationId: sowetoStationId });
const communityId = await upsertUser('community@uncip.test', 'Zanele Khumalo',     'community',  { stationId: sowetoStationId });

void adminId; void authorityId; void communityId;

// Child
console.log('\nChildren:');
const childId = await upsertChild('Sipho', 'Dlamini', '2015-03-12', 'male', sowetoPrimaryId, parentId);

// Guardian link
console.log('\nGuardian links:');
await upsertGuardianLink(childId, parentId, 'parent', true);

console.log('\nUNCIP pilot seed — complete\n');
console.log('Test accounts (password: Pilot2026!):');
console.log('  admin@uncip.test     — admin');
console.log('  parent@uncip.test    — parent  (guardian of Sipho Dlamini)');
console.log('  school@uncip.test    — school  (Soweto Primary School)');
console.log('  authority@uncip.test — authority (Soweto SAPS Station)');
console.log('  community@uncip.test — community (Soweto SAPS Station)');
