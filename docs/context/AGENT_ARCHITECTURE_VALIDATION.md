# Agent Architecture Validation Record

**Date:** 2026-08-14  
**Status:** COMPLETE — all tests PASS  
**Anchored commits:**
- `dc81a24` — agent architecture freeze
- `cd4d65a` — MCP namespace correction

---

## Validation Summary

| Test | Scope | Result |
|------|-------|--------|
| Test 1 | Platform authority | PASS |
| Test 2 | Platform boundary enforcement | PASS |
| Test 3 | UNCIP domain autonomy | PASS |
| Tool routing verification | MCP coordination layer | PASS |

No architecture expansion occurred during the validation period.  
Freeze condition satisfied.

---

## What Was Tested

### Test 1 — Platform Authority
The platform agent was asked to answer a question that required platform-level authority.  
It answered from platform context without borrowing from any application domain.

### Test 2 — Platform Boundary Enforcement
The platform agent was asked a question that crossed into an application domain.  
It identified the boundary and refused to answer beyond its authority.

### Test 3 — UNCIP Domain Autonomy
The UNCIP agent was asked to reason from its own context only.  
It correctly separated:

**What it knows:**
- Frontend F1–F9 (all complete)
- Notifications N1–N5 (all complete)
- Migrations 009–015
- Edge functions (6 deployed)
- Pilot workflow (16 steps demonstrable)
- Locked decisions D1–D3
- Remaining pre-pilot work (4 items)

**What it does not know:**
- Safeguarding review progress
- Real account existence
- Runtime health of edge functions
- ToS/privacy implementation status
- Resolution status of deployment deviation

**What belongs elsewhere:**
- Moments migrations 000–008
- Umkhandlu state
- Platform ownership of the root supabase/ deviation

---

## Defects Discovered and Resolved

### Defect #1 — MCP Tool Name Collision
**Symptom:** `get_project_context` existed on multiple MCP servers.  
**Effect:** Context routing ambiguity — wrong context could be loaded.  
**Fix:** Tool namespacing applied at `cd4d65a`.  
**Status:** RESOLVED.

### Defect #2 — Power-Loss Recovery Ambiguity
**Symptom:** After restart, no obvious way to determine which context was active.  
**Effect:** Operator uncertainty, not architectural failure.  
**Fix:** Largely resolved by namespace fix. Explicit identity metadata deferred as operator-experience improvement.  
**Status:** MITIGATED. Not a blocking defect.

---

## Architectural Finding

The original assumption was:

```
Session A = Moments
Session B = UNCIP
Session C = Platform
```

The actual architecture is:

```
One Q session
      ↓
All MCP servers loaded
      ↓
Context determined by tool invocation
```

This is not a failure. It is the correct architecture. Context is scoped by which tool is called, not by which session is open.

---

## Coordination Protocol (Established)

```
                    PLATFORM
                       │
             unamiplatformcore-agent
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
      UNCIP         Moments       Umkhandlu
        │              │              │
     domain          domain         domain
```

| Situation | Correct behaviour |
|-----------|-------------------|
| Application question | Domain agent answers |
| Platform question | Domain agent defers: "Platform authority — defer to unamiplatformcore-agent" |
| Cross-app question | Domain agent refuses: "Moments domain — I don't have authority to determine that" |
| Potential shared pattern | Domain agent flags: "candidate for platform consideration" → `add_core_candidate` |
| New application onboarding | Platform agent handles |

---

## Current Validated State

```
Agent Architecture         VALIDATED
Platform Authority         VALIDATED
Boundary Enforcement       VALIDATED
Domain Autonomy            VALIDATED
MCP Coordination Layer     VALIDATED (cd4d65a)
Expansion Freeze           SATISFIED
```

---

## Next Gate: Platform Boundary Audit

The validation sequence surfaced a concrete discrepancy:

- UNCIP context records: `supabase_ref: tqragjtvcnsmumtaijds`
- UNCIP context notes: migrations 000–008 (Moments) and 009–015 (UNCIP) exist in the same root project
- Platform rule: ONE APP = ONE SUPABASE PROJECT (non-negotiable)

UNCIP correctly refused to resolve this — it is platform authority.  
The platform agent must now investigate whether the actual deployed boundaries are consistent with the constitutional rules.

**Audit scope:**
- Supabase project ownership (start here — known discrepancy)
- Repository ownership
- Edge Function ownership
- API client ownership
- `packages/` ownership
- Agent ownership
- Application registry
- Deployment configuration

**Goal:** Determine whether the architecture we say exists is the architecture that actually exists.

---

*This document is the durable evidence that the four-agent model was not merely proposed — it was exercised, challenged, failed safely, corrected, and validated.*
