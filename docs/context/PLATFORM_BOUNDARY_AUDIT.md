# Platform Boundary Audit

**Date:** 2026-08-14  
**Triggered by:** Architecture validation — UNCIP Test 3 surfaced Supabase ownership discrepancy  
**Authority:** Platform agent (unamiplatformcore-agent)  
**Scope:** Verify that actual deployed boundaries match constitutional rules

---

## Audit Findings

### 1. Supabase Ownership — DISCREPANCY CONFIRMED

**Constitutional rule:** ONE APP = ONE SUPABASE PROJECT. Non-negotiable.

**Actual state:**

| Layer | What it says |
|-------|-------------|
| `supabase/config.toml` (root) | `project_id = "moments-v2"` |
| `supabase/migrations/` (root) | 000–008 = Moments, **009–015 = UNCIP** |
| `supabase/functions/` (root) | Moments functions + **all 6 UNCIP functions** |
| `apps/uncip/supabase/config.toml` | `id = "tqragjtvcnsmumtaijds"` (UNCIP ref) |
| `apps/uncip/supabase/migrations/` | Partial UNCIP migrations (stale, not operational) |
| `apps/uncip/supabase/functions/` | UNCIP functions (stale stub, not operational) |
| `.env.example` | Two separate Supabase env prefixes: `NEXT_PUBLIC_SUPABASE_*` (Moments) and `NEXT_PUBLIC_UNCIP_SUPABASE_*` (UNCIP) |

**Finding:** The env configuration and `apps/uncip/supabase/config.toml` both point to a separate UNCIP Supabase project (`tqragjtvcnsmumtaijds`). The intent of separation exists. However, the operational reality is that UNCIP migrations and edge functions are deployed through the root `supabase/` directory, which is configured as `moments-v2`.

**This means one of two things is true — and only a live Supabase query can determine which:**

- **Scenario A:** `tqragjtvcnsmumtaijds` is a genuinely separate Supabase project, and the root `supabase/` CLI tooling is linked to it (not to Moments). The `project_id = "moments-v2"` in `config.toml` is a stale label, not the actual linked project. UNCIP migrations 009–015 were pushed to the UNCIP project. The constitutional rule is satisfied in practice.

- **Scenario B:** Both Moments and UNCIP migrations were pushed to the same Supabase project. The constitutional rule is violated. Separation must be executed before BeatsChain onboarding.

**Cannot determine from repository inspection alone.** Requires: `supabase projects list` or direct Supabase dashboard inspection to confirm which project ref the root CLI is linked to.

---

### 2. Repository Ownership — CLEAN

| App | Path | Verdict |
|-----|------|---------|
| Moments | `apps/admin/`, `apps/web/` | Correctly scoped |
| Umkhandlu | `apps/umkhandlu/` | Correctly scoped |
| UNCIP | `apps/uncip/` | Correctly scoped |
| Platform packages | `packages/ui`, `packages/shared`, `packages/api` | Frozen, no domain logic |

No cross-app contamination found in repository structure.

---

### 3. Edge Function Ownership — DISCREPANCY (same root cause as #1)

All UNCIP edge functions (`uncip-alerts`, `uncip-children`, `uncip-media`, `uncip-schools`, `uncip-stations`, `uncip-timeline`) live in root `supabase/functions/` alongside Moments functions.

This is a co-location issue, not a logic contamination issue. Functions are correctly prefixed `uncip-*` and have no cross-app dependencies. The violation is structural (wrong directory), not functional.

**Resolution path:** When Supabase separation is executed, UNCIP functions move to `apps/uncip/supabase/functions/` (the stub already exists).

---

### 4. API Client Ownership — CLEAN

`packages/api/src/clients/uncip-*.ts` — correctly scoped, no Moments or Umkhandlu logic.  
Domain types inlined as string literals. No cross-app imports.

---

### 5. packages/ Ownership — CLEAN

All three packages frozen at v1.0. No domain logic. No app references.  
Deletion test: deleting any app leaves `packages/` compiling. Verified by prior architecture work.

---

### 6. Agent Ownership — CLEAN

| Agent | Scope |
|-------|-------|
| `unamiplatformcore-agent` | Platform authority |
| `uncip-agent` | UNCIP domain only |
| `moments-agent` | Moments domain only |
| `umkhandlu-agent` | Umkhandlu domain only |

Validated by Test 1–3. No agent answered beyond its authority.

---

### 7. Application Registry — CLEAN

Platform context correctly registers three apps with distinct Supabase refs:
- Moments: `dpydmpydyfrrdhuezvgi`
- Umkhandlu: `ufsmpqxniswdnsywjzje`
- UNCIP: `tqragjtvcnsmumtaijds`

The registry asserts separation. Whether the deployment reflects it is the open question in finding #1.

---

### 8. Deployment Configuration — PARTIALLY VERIFIABLE

`.env.example` confirms two separate Supabase env prefixes, consistent with the constitutional rule.  
Vercel deployment configuration not inspectable from this context.

---

## Audit Verdict

| Area | Status |
|------|--------|
| Repository ownership | ✅ CLEAN |
| API client ownership | ✅ CLEAN |
| packages/ ownership | ✅ CLEAN |
| Agent ownership | ✅ VALIDATED |
| Application registry | ✅ CLEAN |
| Edge function ownership | ⚠️ CO-LOCATED (structural, not functional) |
| Supabase project ownership | ⚠️ CANNOT DETERMINE — requires live query |

---

## Required Action Before BeatsChain Onboarding

**Confirm Supabase separation status:**

1. Run `supabase projects list` (requires Supabase CLI auth)
2. Confirm whether `tqragjtvcnsmumtaijds` is a separate project from the Moments project
3. If Scenario A (separated): document it, close the discrepancy, proceed
4. If Scenario B (shared): execute separation before BeatsChain begins — adding a third app's migrations to a shared project would compound the violation

This is a platform-authority action. Neither UNCIP agent nor Moments agent should resolve it.

---

## Supabase MCP Sequencing (Step 4)

Per the validated expansion sequence:

```
Agent architecture validated (✅ done)
      ↓
Coordination protocol established (✅ done)
      ↓
Platform/database boundaries verified (⚠️ one open item)
      ↓
Supabase MCP contract defined
      ↓
One app gets one MCP (app-scoped, not global)
      ↓
Prove it
      ↓
Replicate deliberately
      ↓
n8n later
```

Do not proceed to Supabase MCP until the Supabase ownership question is resolved.  
Each app's MCP must be scoped to its own project only — a global Supabase MCP would undermine the boundary this validation just proved.

---

*Audit conducted by platform agent. No repository, database, or configuration was modified.*
