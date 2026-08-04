# ABSTRACTION_EVIDENCE.md

> Extracted from Umkhandlu source. No simulation. No inference beyond what the code contains.

---

## What Evidence Is

Evidence is anything that proves an institutional event occurred. In Umkhandlu, evidence exists at three levels:

1. **Attachments** — files attached to records (`evidence[]` field)
2. **Environmental context** — weather, location, attendance captured at the time of the event
3. **Verification records** — structured logs of conflicting source reports with authority classification

Source: `src/studio/schema/documents/record.ts`, `src/studio/schema/documents/conflictLog.ts`, `src/lib/weather.ts`, `TCRS.md`

---

## Level 1 — Evidence Attachments

### On `record` documents
```
evidence[]
  type: file
  accepts: .pdf, .doc, .docx, .jpg, .jpeg, .png, .webp
  fields:
    title: string (required)
```

Used for: attendance registers, signed petitions, photographs, certificates, correspondence.

### On `developmentNotice` documents
```
documents[]
  type: file
  accepts: .pdf, .doc, .docx
  fields:
    title: string (required)
```

Used for: EIA reports, site plans, application forms.

### On `conflictLog` claims
```
claims[].evidenceFiles[]
  type: file
  accepts: .pdf, .doc, .docx, .jpg, .jpeg, .png
  fields:
    title: string
```

Used for: IPC certificates, site diary pages, photos, meeting minutes as audit trail.

---

## Level 2 — Environmental Context (Weather)

Source: `src/lib/weather.ts`, `src/app/api/weather-patch/route.ts`

### What It Is

A timestamped snapshot of environmental conditions at the time and location of a governance event. Captured automatically. Never entered manually.

### Why It Belongs on the Record

The record is a time capsule. Weather, location, and attendance are part of the event's circumstances. They help future readers understand the context in which decisions were made.

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
- Past dates: fetched once, patched to Sanity via `/api/weather-patch`, locked permanently
- Records (always past): historical snapshot, fetched once, locked

### Capture Mechanism

```
POST /api/weather-patch
Body: { _id, date, lat, lng }
Auth: SANITY_API_WRITE_TOKEN (server-side only)
```

Called fire-and-forget from the server component on page render. Patches `weatherContext` onto the Sanity document.

Coordinates sourced from `relatedArea → geopoint`. No manual input. If no area or no geopoint, weather is silently skipped.

### Storage

`weatherContext` object field on both `notice` and `record` documents. Stored once, preserved permanently. Available to all Layer 5 derived outputs (lineage certificates, journey maps, evidence packages).

### Data Source

[Open-Meteo](https://open-meteo.com) — free, no API key, covers South Africa.
- Forecast: `https://api.open-meteo.com/v1/forecast`
- Historical: `https://archive-api.open-meteo.com/v1/archive`

---

## Level 3 — Verification Records (TCRS)

Source: `src/studio/schema/documents/conflictLog.ts`, `TCRS.md`

### What It Is

A structured log of conflicting source reports about the same data point on the same project. Preserves all claims. Never deletes a source record. Presents a verified reporting value determined by authority classification.

### The Core Principle

The system does not decide which source is correct. It records → preserves → organises by authority classification → presents for governance use.

### `conflictLog` Schema

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

| Rank | Source Value | Label |
|---|---|---|
| 1 | `engineer` | Engineer Certification |
| 2 | `municipality` | Municipal Record |
| 3 | `pmu` | PMU Verification |
| 4 | `contractor` | Contractor Report |
| 5 | `clo` | CLO / Ward Councillor |
| 6 | `observation` | Field Observation |

### Verification Status
| Value | Label |
|---|---|
| `pending` | 🟡 Pending Review |
| `partial` | 🟠 Under Review |
| `resolved` | 🟢 Verified |
| `escalated` | 🔴 Escalated |

---

## Layer 5 — Derived Evidence Outputs

Evidence stored in Layers 1–4 is used to generate Layer 5 outputs. These outputs are never edited directly — they are regenerated from the underlying records.

| Output | Route | Evidence included |
|---|---|---|
| Governance Record Lineage Certificate | `/notices/lineage/[slug]` | All produced records, evidence counts, `_rev` |
| Governance Journey Map | `/notices/journey/[slug]` | Same as lineage, rendered as branching tree |
| Proof of Publication Certificate | `/notices/certificate/[id]` | Publication date, deadline, documents, URL, `_rev` |

### Integrity Mechanism

Each Layer 5 output exposes the Sanity document revision identifier (`_rev`) of its source records. `_rev` is a system-generated hash assigned to every document mutation. It cannot be edited through Studio or API. It changes whenever the document changes.

A recipient can verify a certificate against the live record by checking whether the `_rev` on the certificate matches the current `_rev` from the Sanity API.

---

## Domain-Specific vs Platform-Generic

| Concept | Domain-specific | Platform-generic |
|---|---|---|
| Evidence attachments on records | ❌ | ✅ |
| Environmental context (weather) on events | ❌ | ✅ |
| Weather auto-capture via external API | ❌ | ✅ |
| Forecast vs historical weather modes | ❌ | ✅ |
| Verification records (conflicting sources) | ❌ | ✅ |
| Source authority classification | ❌ | ✅ |
| Verified reporting value | ❌ | ✅ |
| `_rev`-based certificate integrity | ❌ | ✅ |
| Layer 5 derived outputs | ❌ | ✅ |
| IPC certificates (infrastructure) | ✅ SA construction context | ❌ |
| EPWP workforce tracking | ✅ SA public works context | ❌ |
| Engineer > Contractor authority hierarchy | ✅ SA construction context | ❌ (structure is generic, hierarchy is domain) |

**Platform abstraction:** Evidence is a first-class concept. Records have attachments. Events have environmental context. Conflicting sources are preserved with authority classification. Derived outputs expose source revision identifiers for verifiability. The specific authority hierarchy and evidence types are domain-specific. The structure is platform-generic.
