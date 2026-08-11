# Database Boundaries

**Authority:** This document is the single source of truth for database project ownership in Unami Platform Core.
**Non-negotiable:** Each application owns its own Supabase project. No application shares a database with another.

---

## The Rule

```
One application = one Supabase project = one auth namespace = one database
```

No exceptions. No shared tables across applications. No shared auth.users across applications.

---

## Project Registry

| Application | Directory | Supabase Project | Project Ref | Env Var Prefix |
|---|---|---|---|---|
| Moments (admin + web) | `supabase/` | Moments | `dpydmpydyfrrdhuezvgi` | `NEXT_PUBLIC_SUPABASE_` |
| Unami Control Centre | `apps/umkhandlu/supabase/` | Umkhandlu | `ufsmpqxniswdnsywjzje` | `NEXT_PUBLIC_UMKHANDLU_SUPABASE_` |
| UNCIP | `apps/uncip/supabase/` | UNCIP | `tqragjtvcnsmumtaijds` | `NEXT_PUBLIC_UNCIP_SUPABASE_` |

---

## Directory Structure

```
unami-platform-core/
│
├── supabase/                          ← MOMENTS ONLY
│   ├── migrations/
│   │   ├── 000_initial_schema.sql     ← immutable baseline
│   │   ├── 001_grant_service_role_privileges.sql
│   │   ├── 002_governance_adaptation.sql
│   │   ├── 003_participation_engine.sql
│   │   ├── 004_evidence_layer.sql
│   │   ├── 005_commercial_layer.sql
│   │   ├── 006_platform_records.sql
│   │   ├── 007_whatsapp_tables.sql
│   │   └── 008_community_records.sql
│   ├── functions/                     ← Moments Edge Functions only
│   │   ├── _shared/auth.ts
│   │   ├── analytics/, auth/, authority/, broadcast/, broadcasts/
│   │   ├── campaigns/, evidence/, media/, moderation/, moments/
│   │   ├── notices/, participation/, records/, retry-batches/
│   │   ├── settings/, sponsors/, subscribers/, user-profiles/, webhook/
│   └── config.toml                    ← project_id = "moments-v2"
│
├── apps/umkhandlu/supabase/           ← UNAMI CONTROL CENTRE ONLY
│   ├── migrations/
│   │   ├── 001_governance_nodes.sql
│   │   └── 002_governance_nodes_fix.sql
│   └── (no Edge Functions — Control Centre reads from governance nodes via HTTP)
│
└── apps/uncip/supabase/               ← UNCIP ONLY
    ├── migrations/
    │   └── 20250101000000_uncip_schema.sql
    ├── functions/
    │   ├── _shared/uncip-auth.ts
    │   ├── uncip-alerts/
    │   ├── uncip-children/
    │   ├── uncip-schools/
    │   ├── uncip-stations/
    │   └── uncip-timeline/
    └── config.toml                    ← project_id = "tqragjtvcnsmumtaijds"
```

---

## Environment Variable Naming Convention

Each application uses a prefixed namespace. Generic `NEXT_PUBLIC_SUPABASE_URL` is reserved for Moments only.

### Moments (`supabase/` — `apps/admin`, `apps/web`)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Unami Control Centre (`apps/umkhandlu`)
```
NEXT_PUBLIC_UMKHANDLU_SUPABASE_URL
NEXT_PUBLIC_UMKHANDLU_SUPABASE_ANON_KEY
UMKHANDLU_SUPABASE_SERVICE_ROLE_KEY
```

### UNCIP (`apps/uncip`)
```
NEXT_PUBLIC_UNCIP_SUPABASE_URL
NEXT_PUBLIC_UNCIP_SUPABASE_ANON_KEY
UNCIP_SUPABASE_SERVICE_ROLE_KEY
```

---

## What Each Database Contains

### Moments (`dpydmpydyfrrdhuezvgi`)
Moments domain tables only. No UNCIP tables. No governance node tables.
```
moments, broadcasts, subscribers, campaigns, evidence,
participation_log, records, notices, sponsors, settings,
user_profiles, retry_batches, moment_stats
```

### Unami Control Centre (`ufsmpqxniswdnsywjzje`)
Control Centre operational tables only. No Moments tables. No UNCIP tables.
```
governance_nodes, governance_node_health (future)
```
The Control Centre reads governance data from external nodes via HTTP — it does not replicate node data locally.

### UNCIP (`tqragjtvcnsmumtaijds`)
UNCIP domain tables only. No Moments tables. No governance tables.
```
uncip_saps_stations, uncip_schools, uncip_user_profiles,
uncip_children, uncip_child_medical, uncip_guardian_links,
uncip_alerts, uncip_alert_timeline
```

---

## Auth Namespaces

Each Supabase project has its own `auth.users` table. Users are not shared.

| Project | Who authenticates |
|---|---|
| Moments | Moments operators (admin staff) |
| Unami Control Centre | Control Centre operators |
| UNCIP | Parents, school staff, SAPS officers, community members, UNCIP admins |

A Moments operator cannot log into UNCIP. A UNCIP parent cannot log into the Control Centre.
This is enforced by the separate auth namespaces — not by application code.

---

## CLI Operations

When running Supabase CLI commands, always `cd` into the correct supabase directory first.

```bash
# Moments
cd /workspaces/unami-platform-core
supabase db push --linked

# Unami Control Centre
cd /workspaces/unami-platform-core/apps/umkhandlu/supabase
supabase db push --linked

# UNCIP
cd /workspaces/unami-platform-core/apps/uncip/supabase
supabase db push --linked
```

Never run Supabase CLI from the repo root for UNCIP or Umkhandlu operations.
Never run Supabase CLI from an app supabase directory for Moments operations.

---

## Hard Rules

1. Never add a migration to `supabase/migrations/` that is not a Moments migration.
2. Never add a migration to `apps/umkhandlu/supabase/migrations/` that is not a Control Centre migration.
3. Never add a migration to `apps/uncip/supabase/migrations/` that is not a UNCIP migration.
4. Never use `NEXT_PUBLIC_SUPABASE_URL` in `apps/umkhandlu` or `apps/uncip`.
5. Never use `NEXT_PUBLIC_UNCIP_SUPABASE_URL` in `apps/admin`, `apps/web`, or `apps/umkhandlu`.
6. Never use `NEXT_PUBLIC_UMKHANDLU_SUPABASE_URL` in `apps/admin`, `apps/web`, or `apps/uncip`.
7. Each app's `src/lib/env.ts` (or equivalent) must throw at startup if its own vars are missing.
8. The Supabase CLI `--linked` state is per-directory. Always verify which project is linked before pushing.
