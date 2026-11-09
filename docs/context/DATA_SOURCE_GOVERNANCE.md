# Data Source Governance Standard

Platform standard — Unami Platform Core
Applies to: any system that registers, ingests, displays or redistributes external data
Last updated: 2026-11-09

---

## Purpose

Every Unami system that works with external data sources — geographic, institutional,
statistical, regulatory or otherwise — must apply a consistent governance model to those
sources. This standard defines that model.

It exists because public accessibility is routinely confused with permission, and technical
availability is routinely confused with authority. These are not the same things, and
conflating them creates legal, operational and reputational risk.

---

## The Four Dimensions of a Data Source

Every source must be assessed across four independent dimensions. A positive answer on one
does not imply a positive answer on any other.

| Dimension | Question |
|---|---|
| Availability | Can the source be accessed? |
| Permission | What may Unami legally and operationally do with it? |
| Technical usability | Can it be ingested, transformed or displayed? |
| Authority | Is it an authoritative source for the information being represented? |

An active, publicly accessible source may have no redistribution permission.
A technically ingestible source may not be authoritative for the claim being made.
A source with confirmed permission may still require attribution, licence compliance or
custodian notification before use.

These dimensions must be assessed and recorded separately. They must not be collapsed into
a single status field.

---

## Permission Classification

Permission is a controlled classification. It must be assigned based on the actual source
terms, custodian instructions or applicable legislation — not inferred from public
accessibility.

| Classification | Meaning |
|---|---|
| `reference` | Consult or reference under stated conditions. Do not copy, republish or redistribute. |
| `display` | Display permitted under specified conditions. Attribution required. |
| `internal` | Use within authorised Unami operations only. Not for publication or redistribution. |
| `download` | Download and process permitted. Redistribution subject to separate assessment. |
| `redistribute` | Redistribution expressly permitted under stated terms. |
| `restricted` | Access or use subject to explicit restrictions. Requires authorised clearance before any use. |
| `prohibited` | Use not permitted. Source must not be ingested, displayed or referenced. |
| `pending` | Permission not yet assessed or confirmed. Source must not be used until classification is assigned. |

A source classified as `active` and `reference` is not contradictory. Active means the
source is registered and usable for its permitted purpose. Reference means that permitted
purpose is consultation only — not copying, republishing or redistribution.

---

## Source Record Structure

Every registered source must capture the following. Systems may extend this structure but
must not omit these fields.

**1. Source identity**
- Name, institution, custodian name, custodian contact
- Source URL or access endpoint
- Dataset identifier (where the source assigns one)

**2. Coverage and geography**
- Geographic extent (district, municipality, ward, locality, national, etc.)
- Spatial reference system (CRS)
- Scale or resolution where relevant

**3. Technical connection**
- Service type (ArcGIS FeatureServer, WFS, download, static map, API, etc.)
- Endpoint, format, layers, query capability
- Authentication requirements

**4. Permission and custodian**
- Permission classification (from controlled list above)
- Attribution requirements
- Licence or terms reference
- Specific restrictions
- Evidence of permission (correspondence, terms URL, custodian confirmation)

**5. Data integrity**
- Source date or dataset version
- Last checked date
- Known limitations or caveats
- Validation rules

**6. Operational status**
- Active / unavailable / restricted / expired / pending verification
- Reason for current status

**7. Ingestion history**
- Import runs, validation results, staging, operator approval, publication, rejections

**8. Audit history**
- Every change to source metadata, permission classification or operational status
- Actor, timestamp, previous value, new value

---

## Hard Restrictions

Certain restrictions are absolute and must be enforced at the system level — not merely
noted in a source record.

A hard restriction means:
- The data must not enter the ingestion pipeline without authorised clearance
- The data must not be published, displayed or redistributed
- The restriction and its originating authority must be retained in the source register
- The restriction applies to exports, API responses, map layers and generated reports
- Access attempts and administrative changes must be audited

Hard restrictions are specific to the named data and its stated scope. They do not
automatically extend to related or adjacent datasets unless the restriction explicitly
covers them.

**Example:** Water and sanitation infrastructure data from Amajuba District Municipality
is subject to an absolute restriction confirmed by the custodian. This restriction applies
to that specific dataset. It does not automatically apply to rivers, dams, rainfall data,
environmental layers or other water-related information from other sources — each of which
requires its own permission and custodian assessment.

---

## Static Maps and Non-Queryable Sources

A static map is not a queryable feature dataset. Before a static map can become a map
layer or be used as a spatial reference, the following must be established:

- Georeferencing method and accuracy
- Scale and spatial precision
- Permitted use (display, reference, internal, etc.)
- Attribution requirements
- Whether the map represents authoritative boundaries or illustrative content

A static map that is publicly accessible does not automatically have permission for
redistribution, display or use as an authoritative boundary reference.

---

## What This Standard Does Not Permit

- Assigning `redistribute` or `display` permission because a service is publicly accessible
- Using a source before its permission classification is confirmed (`pending` blocks use)
- Treating a source as authoritative without verifying its institutional provenance
- Ingesting restricted data without documented authorised clearance
- Omitting custodian information because it was not immediately available
- Collapsing the four dimensions into a single active/inactive status

---

## Application Across Systems

This standard applies to:

- `apps/umkhandlu` — spatial source registry (GIS, boundaries, institutional datasets)
- Any future system that registers external APIs, data feeds or institutional datasets
- Any system that displays, publishes or redistributes information derived from external sources

Each system implements this standard through its own source register UI and database schema.
The controlled permission classifications and the four-dimension assessment model are
non-negotiable across all implementations.
