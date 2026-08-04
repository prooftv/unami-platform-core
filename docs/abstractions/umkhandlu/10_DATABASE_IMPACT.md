# 10 — Database Impact

> Umkhandlu Abstraction Pack · Unami Platform Core

---

## Purpose

This document identifies what the platform database will eventually need to support the full governance domain. It does not write SQL. It classifies future tables by ownership and priority, so that when implementation begins, the schema evolution is deliberate.

No table in this document is created until a concrete product requirement demands it.

---

## Current Platform Schema (26 Tables — Frozen)

The current schema supports Moments. It is complete for Moments.

**Core content:** `moments`, `sponsors`, `campaigns`
**Publishing pipeline:** `moment_intents`, `broadcasts`, `broadcast_batches`
**Community:** `subscriptions`, `messages`, `advisories`, `moderation_audit`, `comments`, `whatsapp_comments`
**Authority:** `authority_profiles`, `authority_audit_log`
**Admin:** `admin_roles`, `user_profiles`
**Assets:** `media`, `moment_stats`
**Analytics:** `analytics_events`, `marketing_compliance`, `budget_transactions`
**System:** `system_settings`, `feature_flags`, `rate_limits`, `audit_logs`, `error_logs`

---

## Future Tables — Classified

### Platform Tables
Owned by the platform. Reusable across all applications. Added when the first application that needs them is being built.

| Table | Purpose | Trigger |
|---|---|---|
| `records` | Institutional memory nodes with lineage | Phase 19 (Umkhandlu) |
| `record_relationships` | Parent/child record chain (explicit join table) | Phase 19 |
| `notices` | Governance event origins (community + statutory) | Phase 19 |
| `evidence` | File attachments on records and notices | Phase 19 |
| `participation_log` | Anonymised community feedback log | Phase 19 |
| `participation_counts` | Denormalised comment counts per notice | Phase 19 |
| `conflict_logs` | TCRS variance tracking records | Phase 19 |
| `conflict_claims` | Individual source reports within a conflict log | Phase 19 |
| `project_updates` | Event log entries on campaigns | Phase 19 |
| `stakeholders` | Organisations and individuals in governance processes | Phase 19 |
| `stakeholder_roles` | Role assignments for stakeholders on records/campaigns | Phase 19 |
| `activity_events` | Platform-wide event stream for intelligence | Phase 19 |

### Moments Tables (Already Exist)
These tables already exist and serve Moments. They will not be renamed or restructured.

| Table | Notes |
|---|---|
| `moments` | The Moments equivalent of `records` |
| `campaigns` | Already has `campaign_type` — will gain `csr` type support in future |
| `sponsors` | Direct equivalent — no changes needed |
| `authority_profiles` | Moments-specific — not the same as governance authority |

### Umkhandlu Tables
Domain-specific. Added when Umkhandlu is built (Phase 19). Never in `packages/`.

| Table | Purpose |
|---|---|
| `governance_nodes` | Traditional council / institution registry |
| `governance_areas` | Geographic jurisdictions (isigodi, ward, etc.) |
| `governance_persons` | Inkosi, Induna, councillors, officials |
| `smme_directory` | Local business registry per project |
| `statutory_mandates` | Legal framework references per notice type |

### Commercial Tables (Future)
Added when the commercial layer is extended beyond Moments campaigns.

| Table | Purpose | Trigger |
|---|---|---|
| `deliverables_certified` | Certified deliverable records | Phase 19 (Umkhandlu CSR) |
| `progress_log` | Timestamped project progress entries | Phase 19 |
| `funding_sources` | Programme / entity funding registry | Phase 19 |
| `budget_lines` | Line-item budget tracking | Phase 19 |
| `impact_records` | Beneficiary and impact tracking | Phase 19 |

### Intelligence Tables (Future)
Added when the intelligence layer is built. Not before.

| Table | Purpose | Trigger |
|---|---|---|
| `intelligence_nodes` | Registered governance node deployments | Phase 19+ |
| `node_health_snapshots` | Periodic health snapshots per node | Phase 19+ |
| `aggregated_metrics` | Pre-computed cross-node metrics | When performance requires it |

---

## Schema Evolution Rules

These rules apply to every future migration:

1. `000_initial_schema.sql` is immutable — never modify it.
2. New migrations are numbered sequentially: `001_`, `002_`, etc.
3. `docs/DATABASE_SCHEMA.md` is updated first — then the migration is written.
4. Platform tables are added in platform migrations — not in application migrations.
5. Application tables are added in application migrations — not in platform migrations.
6. No table is added speculatively — only when a concrete product requirement demands it.
7. Foreign keys between platform tables and application tables are allowed — but the platform table must exist first.
8. JSONB columns are used for structured data that does not need to be queried independently (e.g. `weather_context`, `progress_log`, `deliverables_certified`).
9. Separate tables are used for structured data that needs to be queried, filtered, or joined (e.g. `evidence`, `conflict_claims`, `project_updates`).

---

## Column Conventions

These conventions apply to all future tables:

| Convention | Rule |
|---|---|
| Primary key | `id UUID DEFAULT gen_random_uuid()` |
| Created timestamp | `created_at TIMESTAMPTZ DEFAULT NOW()` |
| Updated timestamp | `updated_at TIMESTAMPTZ DEFAULT NOW()` |
| Soft delete | `deleted_at TIMESTAMPTZ` — nullable, null means active |
| Status | `status TEXT NOT NULL` — string enum, not PostgreSQL enum type |
| Type | `type TEXT NOT NULL` — string enum, not PostgreSQL enum type |
| Foreign keys | `[table]_id UUID REFERENCES [table](id)` |
| JSONB | `[field] JSONB` — for structured data that does not need independent querying |
| Application scope | `app_id TEXT` — for multi-application tables that need row-level isolation |

---

## RLS Policy Conventions

Row-level security applies to all tables. Conventions:

| Policy | Rule |
|---|---|
| Public read | `status = 'published' AND deleted_at IS NULL` |
| Authenticated read | `auth.role() = 'authenticated'` |
| Application scope | `app_id = current_setting('app.current_app_id')` |
| Service role bypass | Edge Functions use service role key — RLS bypassed at the function level |

---

## What Does Not Change

The current 26-table schema is frozen for Moments. No table is modified for Umkhandlu compatibility. New tables are added alongside the existing schema — never replacing or restructuring it.

The `moments` table is not renamed to `records`. The `authority_profiles` table is not repurposed as a governance authority table. The existing schema is Moments-specific and stays that way.

When Umkhandlu is built, it gets its own tables. The platform tables (`records`, `notices`, `evidence`, etc.) are new additions — not replacements.
