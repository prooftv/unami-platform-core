# 05 — Evidence Architecture

> Umkhandlu Abstraction Pack · Unami Platform Core
> Source: `ABSTRACTION_EVIDENCE.md`

---

## What Evidence Is

Evidence is anything that proves an institutional event occurred. It is a first-class concept — not an afterthought, not a file upload field.

Evidence exists at three levels:

```
Level 1 — Attachments
  Files attached to records and notices
  PDFs, documents, images, certificates

Level 2 — Environmental Context
  Weather, location, attendance captured at the time of the event
  Auto-captured, never manually entered, locked permanently

Level 3 — Verification Records
  Structured logs of conflicting source reports
  Authority-classified, preserved, never deleted
```

---

## Level 1 — Evidence Attachments

### On Records
```
evidence[]
  type: file
  accepts: .pdf, .doc, .docx, .jpg, .jpeg, .png, .webp
  fields:
    title: string (required)
```

Used for: attendance registers, signed petitions, photographs, certificates, correspondence.

### On Statutory Notices
```
documents[]
  type: file
  accepts: .pdf, .doc, .docx
  fields:
    title: string (required)
```

Used for: EIA reports, site plans, application forms.

### On Verification Records (TCRS)
```
claims[].evidenceFiles[]
  type: file
  accepts: .pdf, .doc, .docx, .jpg, .jpeg, .png
  fields:
    title: string
```

Used for: IPC certificates, site diary pages, photos, meeting minutes as audit trail.

### Platform Rule
Evidence attachments are additive. They are never removed. A record's evidence set only grows.

---

## Level 2 — Environmental Context (Weather)

### What It Is

A timestamped snapshot of environmental conditions at the time and location of a governance event. Captured automatically. Never entered manually.

### Why It Belongs on the Record

The record is a time capsule. Weather, location, and attendance are part of the event's circumstances. They help future readers understand the context in which decisions were made.

A meeting held during a flood is different from a meeting held on a clear day. The weather is evidence.

### WeatherSnapshot Type

```typescript
type WeatherSnapshot = {
  type: 'forecast' | 'historical';
  condition: string;           // WMO code → human label (e.g. "Clear sky")
  temperatureCelsius: number;  // daily average
  tempMinCelsius: number;
  tempMaxCelsius: number;
  rainfallMm: number;
  windKmh: number;
  humidityPercent: number;     // median hourly humidity
  uvIndex: number;
  fetchedAt: string;           // ISO timestamp of capture
}
```

### Two Modes

| Mode | When | Label | Source |
|---|---|---|---|
| `forecast` | Event date is in the future | 🔮 Predicted | Open-Meteo forecast API |
| `historical` | Event date is in the past | ✓ Recorded | Open-Meteo historical archive |

### Locking Logic

- Future dates: re-fetched on every page visit (forecast updates as date approaches)
- Past dates: fetched once, patched to the record, locked permanently
- Records (always past): historical snapshot, fetched once, locked

### Capture Mechanism

```
POST /api/weather-patch
Body: { _id, date, lat, lng }
Auth: server-side write token only
```

Called fire-and-forget from the server component on page render. Patches `weatherContext` onto the record document.

Coordinates sourced from `relatedArea → geopoint`. No manual input. If no area or no geopoint, weather is silently skipped.

### Data Source

Open-Meteo — free, no API key, covers South Africa and globally.
- Forecast: `https://api.open-meteo.com/v1/forecast`
- Historical: `https://archive-api.open-meteo.com/v1/archive`

---

## Level 3 — Verification Records (TCRS)

### What It Is

The Truth Conflict Resolution System. A structured log of conflicting source reports about the same data point on the same project.

When multiple sources report different values for the same fact, TCRS:
1. Preserves all source reports — nothing is deleted
2. Classifies them by institutional authority
3. Presents a verified reporting value
4. Tracks escalation until resolved

### The Core Principle

The system does not decide which source is correct. It records → preserves → organises by authority classification → presents for governance decision.

### Conflict Log Structure

| Field | Type | Notes |
|---|---|---|
| `campaign` | reference → campaign | The project this relates to |
| `field` | enum | Which data point has variance |
| `conflictType` | enum | Variance classification |
| `claims[]` | object array | All source reports — minimum 2 required |
| `displayTruth` | string | Verified reporting value |
| `resolutionState` | enum | Verification status |
| `escalationLevel` | enum | Current escalation tier |
| `resolutionNote` | text | How variance was resolved |
| `detectedAt` | date | When variance was identified |
| `resolvedAt` | date | When verification was confirmed |

### Claim Object

| Field | Type | Notes |
|---|---|---|
| `source` | enum | Authority classification of this source |
| `value` | string | Reported value (e.g. "55%" or "Construction phase") |
| `date` | date | When reported |
| `evidence` | text | Reference to IPC, site diary, minutes, certificate |
| `evidenceFiles[]` | file array | Uploaded audit trail documents |

### Variance Types

| Value | Label | Example |
|---|---|---|
| `numerical` | Numerical Variance | Contractor 70% / Engineer 55% |
| `status` | Status Variance | "Phase complete" vs "Still construction" |
| `time` | Timeline Variance | "Installed last week" vs "Not yet certified" |
| `workforce` | Workforce Variance | 80 workers reported vs 45 observed |
| `political` | Contextual Variance | "Project stalled" vs "On schedule" |

### Source Authority Classification

The authority hierarchy is domain-specific. The structure — ranked sources, preserved claims, verified reporting value — is platform-generic.

**Umkhandlu hierarchy (SA infrastructure context):**

| Rank | Source | Label |
|---|---|---|
| 1 | `engineer` | Engineer Certification |
| 2 | `municipality` | Municipal Record |
| 3 | `pmu` | PMU Verification |
| 4 | `contractor` | Contractor Report |
| 5 | `clo` | CLO / Ward Councillor |
| 6 | `observation` | Field Observation |

**Platform-generic pattern:**
Any application can define its own authority hierarchy. The structure is: ranked sources, each with a claim, each with evidence, resolved to a single verified value.

### Verification Status

| Value | Label |
|---|---|
| `pending` | 🟡 Pending Review |
| `partial` | 🟠 Under Review |
| `resolved` | 🟢 Verified |
| `escalated` | 🔴 Escalated |

---

## Layer 5 — Derived Evidence Outputs

Evidence stored in Levels 1–3 is used to generate Layer 5 outputs. These outputs are never edited directly — they are regenerated from the underlying records.

| Output | What it contains |
|---|---|
| Governance Record Lineage Certificate | All produced records, evidence counts, source revision identifier |
| Governance Journey Map | Same as lineage, rendered as branching tree |
| Proof of Publication Certificate | Publication date, deadline, documents, URL, source revision identifier |

### Integrity Mechanism

Each Layer 5 output exposes the source document's revision identifier (`_rev` in Sanity, equivalent in other systems). This identifier:
- Is system-generated — cannot be manually set
- Changes whenever the source document changes
- Is exposed on the certificate

A recipient can verify a certificate against the live record by checking whether the revision identifier on the certificate matches the current revision from the API.

This is the chain of custody. The certificate is only as trustworthy as the source record it was generated from.

---

## Platform Implementation Notes

When implementing evidence in Unami Platform Core:

1. `evidence` is a separate table with `record_id` and `notice_id` foreign keys — not a JSONB array.
2. Evidence rows are never deleted — only soft-deleted with a `deleted_at` timestamp if absolutely required.
3. `weather_context` is a JSONB column on both `records` and `notices` — the `WeatherSnapshot` type is platform-generic.
4. Weather capture is a background operation — fire-and-forget, never blocking.
5. The TCRS `conflict_logs` table is a platform table — the authority hierarchy is application-defined.
6. Layer 5 outputs are generated on demand — never stored as primary records.
7. The revision identifier for Layer 5 integrity is the record's `updated_at` timestamp plus a content hash — not a Sanity-specific concept.
8. Evidence file storage uses Supabase Storage — the `evidence` table stores metadata and the storage path.
