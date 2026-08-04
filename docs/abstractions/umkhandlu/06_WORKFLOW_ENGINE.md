# 06 — Workflow Engine

> Umkhandlu Abstraction Pack · Unami Platform Core

---

## What the Workflow Engine Is

The workflow engine is not a separate system. It is the emergent behaviour of the record lineage chain, the notice lifecycle, and the participation architecture working together.

Governance moves through the platform as a sequence of typed events. Each event produces a record. Each record references what came before. The workflow is the chain.

---

## The Core Workflow Pattern

Every governance workflow follows the same structural pattern:

```
Origin Event (Notice)
    │
    ▼
Record Created (from notice)
    │
    ├── Evidence attached
    ├── Authority signs off
    ├── Status transitions
    │
    ▼
Follow-up Event (Notice or Record)
    │
    ▼
Record Created (from parent record)
    │
    ├── Evidence attached
    ├── Authority signs off
    ├── Status transitions
    │
    ▼
... (chain continues until terminal state)
    │
    ▼
Terminal Record (resolved / adopted / completed)
    │
    ▼
Layer 5 Output (certificate, lineage map, audit package)
```

The workflow is not configured. It is composed from records and references.

---

## Governance Workflow Examples

### Meeting → Resolution → Action

```
Meeting Notice (type: meeting)
    │
    ▼
Minutes Record (originNotice → Meeting Notice)
    │
    ├── Attendance register attached
    ├── Weather context captured
    │
    ▼
Resolution Record (parentRecord → Minutes)
    │
    ├── Approved by authority
    ├── Status: adopted
    │
    ▼
Action Record (parentRecord → Resolution)
    │
    ├── Assigned to responsible party
    ├── Status: open
    │
    ▼
Outcome Record (parentRecord → Action)
    │
    ├── Evidence of completion attached
    ├── Status: resolved
    │
    ▼
Lineage Certificate (Layer 5)
```

### Development Notice → Public Participation → Decision

```
Development Notice (type: eia, status: open)
    │
    ├── Comment period active
    ├── Public comments → webhook → never stored
    ├── commentsReceived counter updated
    │
    ▼
Comment Period Closed
    │
    ├── Participation log updated (anonymised)
    ├── Proof of publication certificate generated
    │
    ▼
Decision Record (parentRecord → Development Notice)
    │
    ├── Approved by authority
    ├── Status: approved / rejected / withdrawn
    │
    ▼
Proof of Publication Certificate (Layer 5)
```

### Infrastructure Project → Progress → Completion

```
Campaign (type: csr, status: active)
    │
    ├── Deliverables defined
    ├── Funding source recorded
    ├── Contractor assigned
    │
    ▼
Progress Log Entries (timestamped)
    │
    ├── Engineer-verified percentages
    ├── TCRS conflict logs (if variance detected)
    │
    ▼
Certified Deliverables (status: certified)
    │
    ├── certifiedBy set
    ├── percentageComplete: 100
    ├── certificationDate set
    │
    ▼
Project Update Records (event log)
    │
    ├── Sod turning ceremony
    ├── Commissioning event
    ├── Handover ceremony
    │
    ▼
Project Outcome Record (parentRecord → Campaign)
    │
    ├── Impact summary
    ├── Lessons learned
    ├── Status: completed
    │
    ▼
Campaign Export (Layer 5 — JSON report)
```

---

## Workflow States

Every workflow has a set of valid states. The platform does not enforce transitions — governance process does. The platform records the state.

### Notice States
```
draft → published → archived
                 ↓
         (statutory only)
         open → closed → approved / rejected / withdrawn
```

### Record States
```
pending → adopted / approved / resolved / rejected
open → resolved  (matter records only)
```

### Campaign States
```
draft → approved → active → completed → reported
```

### Deliverable States
```
pending → certified / disputed
```

### Verification States
```
pending → partial → resolved
                 ↓
              escalated
```

---

## Workflow Triggers

Workflows are triggered by human action, not by automation. The platform does not automatically transition states. An operator or authority must act.

The exception is environmental context capture (weather) — this is the only automated action in the workflow engine. It fires on page render, not on state transition.

Future automation (n8n, scheduled functions) will add:
- Reminder notifications when comment deadlines approach
- Escalation notifications when TCRS items are unresolved
- Digest generation from completed workflows
- Cross-node aggregation for the intelligence dashboard

---

## Moments Workflow Mapping

The Moments broadcast workflow is structurally equivalent to the governance workflow.

| Governance workflow step | Moments equivalent |
|---|---|
| Notice published | Moment created |
| Record produced | Broadcast created |
| Evidence attached | Media attached |
| Authority approves | Admin approves |
| Status: adopted | Status: broadcasted |
| Broadcast to community | WhatsApp delivery |
| Community response | WhatsApp reply |
| Participation log | — (not yet implemented) |
| Outcome record | — (not yet implemented) |

The Moments workflow is simpler — it does not have lineage chains, statutory participation, or TCRS. But the structural pattern is the same: origin event → record → evidence → authority → delivery → response.

---

## Platform Implementation Notes

When implementing the workflow engine in Unami Platform Core:

1. The workflow engine is not a separate service — it is the record lineage chain.
2. State transitions are recorded as status updates on records — not as separate workflow events.
3. An `audit_logs` table records every state transition with actor, timestamp, and previous state.
4. Workflow templates are not stored in the database — they are documented patterns, not configured rules.
5. Automation hooks (n8n, Edge Functions) attach to state transitions via database triggers or webhook calls — they do not replace the record chain.
6. The workflow is always reconstructable from the record chain — even if automation fails, the governance record is intact.
