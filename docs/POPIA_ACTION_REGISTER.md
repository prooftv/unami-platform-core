# POPIA Compliance Action Register — Umkhandlu

**Date:** 2026-11-18  
**Status:** Working document — not a compliance declaration  
**Responsible:** Unami Foundation NPC

---

## Important disclaimer

This document identifies what needs to be done. It does not declare Unami Foundation or Umkhandlu compliant with POPIA. Compliance requires organisational decisions, legal advice, and implemented controls — not documentation alone.

---

## 1. Information Officer designation

**Requirement:** POPIA s.55 requires every responsible party to designate an Information Officer (IO). For a company, this defaults to the CEO/MD unless another person is designated and registered with the Information Regulator.

**Current status:** No IO has been formally designated or registered.

**Action required (human decision):**
- Designate a named individual as Information Officer
- Register with the Information Regulator at https://www.justice.gov.za/inforeg/
- Designate a Deputy IO if appropriate
- Document the designation in organisational records

**Responsible:** Founding director / board

---

## 2. Data processing inventory

### 2.1 Control Centre (Supabase — ufsmpqxniswdnsywjzje, eu-west-1)

| Data category | Fields | Purpose | Lawful basis | Retention | Public? |
|---|---|---|---|---|---|
| Operator accounts | email, name, role | CC authentication and audit | Contractual | Until account deleted | No |
| Operator email in audit log | actor field | Immutable audit trail | Legitimate interest | Indefinite (immutable) | No |
| Notice created_by | display name (fixed in 8c0f6d0) | Attribution | Operational | Until notice deleted | Partially (published notices) |
| Field collector identity | display_name, email, gratisgis_user_id | Field operations management | Contractual | Until deactivated | No |
| Field submission geometry | GPS coordinates, geometry_geojson | Spatial data collection | Contractual | Until deleted | No |
| Field submission attributes | form fields (variable) | Evidence collection | Contractual | Until deleted | No |
| Field submission attachments | filename, mime_type, gratisgis_url | Evidence | Contractual | Until deleted | No |
| Risk and compliance records | title, description, owner | Operational risk management | Legitimate interest | Indefinite | No |
| Governance node records | node URL, API key, name | Integration management | Contractual | Until node removed | No |

### 2.2 Governance Node / Sanity (project 60v9eb0r)

| Data category | Fields | Purpose | Lawful basis | Retention | Public? |
|---|---|---|---|---|---|
| Public comment submissions | name (optional), comment text | Community participation | Consent | TBD | No (stored in Sanity) |
| Development notice applicant | applicant name, reference number | Statutory notice | Legal obligation | Statutory period | Yes (published notices) |
| Area/locality records | place names, ward numbers | Geographic reference | Public interest | Indefinite | Yes |
| Operator profiles | name, role | Governance record | Contractual | Until removed | Partially |

### 2.3 Vercel (deployment platform)

| Data | Purpose | Transfer | Notes |
|---|---|---|---|
| Request logs | Operational | US (Vercel infrastructure) | Vercel DPA applies |
| Build logs | Operational | US | Vercel DPA applies |
| Environment variables | Configuration | US | Contains service credentials |

**Cross-border transfer note:** Supabase eu-west-1 (Ireland) is covered by EU adequacy. Vercel US transfer requires assessment under POPIA s.72 — transfer is permitted if the recipient country has adequate protection or appropriate safeguards are in place. Vercel's DPA and SCCs should be reviewed.

---

## 3. Lawful basis assessment

POPIA s.11 requires a lawful basis for each processing activity. The following bases are applicable:

| Processing | Proposed basis | Notes |
|---|---|---|
| Operator authentication | Contractual necessity (s.11(1)(b)) | Operators agree to terms of access |
| Audit logging of operator actions | Legitimate interest (s.11(1)(f)) | Necessary for accountability and security |
| Field collector management | Contractual necessity | Collectors are engaged for a specific purpose |
| Field submission data | Contractual necessity | Collectors submit data as part of their role |
| Public comment forms | Consent (s.11(1)(a)) | Consent checkbox implemented (Governance Node) |
| Published notice content | Legal obligation (s.11(1)(c)) | Statutory notices required by law |
| Risk and compliance records | Legitimate interest | Internal governance management |

**Action required:** Legal review of these proposed bases. Do not rely on this assessment as legal advice.

---

## 4. Data subject rights

POPIA grants data subjects rights including access (s.23), correction (s.24), and objection (s.11(3)).

**Current status:** No formal procedure exists for handling data subject requests.

**Actions required:**
- [ ] Designate a contact point for data subject requests (typically the IO)
- [ ] Document the procedure for handling access, correction and deletion requests
- [ ] Establish response timeframes (POPIA does not specify but reasonable practice is 30 days)
- [ ] Determine what data can be deleted vs. what must be retained (audit logs are immutable by design)

---

## 5. Security safeguards (POPIA s.19)

POPIA requires appropriate technical and organisational measures.

**Implemented:**
- Row-level security on all Supabase tables
- Service role key not exposed to client
- Operator authentication via Supabase Auth
- Immutable audit log
- Session check on all server actions (fixed in 8c0f6d0)
- Attachment proxy — no direct URL exposure (implemented this session)
- Webhook secret authentication on ingest API

**Not yet implemented / requires human decision:**
- [ ] Formal security policy document
- [ ] Incident response procedure
- [ ] Backup and recovery testing
- [ ] Dependency vulnerability scanning (automated)
- [ ] Access review process (periodic review of who has operator access)

---

## 6. Operator agreements (POPIA s.21)

Where Unami Foundation uses third-party operators (processors), written agreements are required.

| Operator | Role | Agreement status |
|---|---|---|
| Vercel | Hosting and deployment | Vercel DPA — review required |
| Supabase | Database and auth | Supabase DPA — review required |
| Sanity | Content management | Sanity DPA — review required |
| GratisGIS (palavido-dev) | Field data collection | No agreement yet — required before deployment |

**Action required:** Review and execute DPAs with each operator before processing personal data at scale.

---

## 7. Privacy impact assessment

A Privacy Impact Assessment (PIA) is recommended (not yet mandatory under POPIA but considered best practice) for:
- Field collection activities (GPS data, photographs, collector identity)
- Public comment forms (community members submitting personal information)
- Any future integration that processes personal information at scale

**Action required (human decision):** Commission a PIA before GratisGIS field collection goes live.

---

## 8. Retention and deletion

**Current status:** No retention policy is documented or enforced.

**Actions required:**
- [ ] Define retention periods for each data category
- [ ] Implement deletion procedures (noting that audit logs are intentionally immutable)
- [ ] Document the basis for indefinite retention of audit records
- [ ] Establish a process for collector data deletion when a collector is deactivated

---

## 9. Incident response

**Current status:** No incident response procedure exists.

**Actions required:**
- [ ] Define what constitutes a reportable incident under POPIA s.22
- [ ] Establish notification procedure to the Information Regulator (within reasonable time)
- [ ] Establish notification procedure to affected data subjects
- [ ] Designate who is responsible for incident response

---

## 10. Outstanding decisions requiring human authorisation

| Decision | Responsible | Priority |
|---|---|---|
| Designate and register Information Officer | Founding director | Critical |
| Execute DPAs with Vercel, Supabase, Sanity | Founding director | High |
| Execute operator agreement with GratisGIS before field collection goes live | Founding director | High |
| Commission Privacy Impact Assessment for field collection | Founding director | High |
| Define and document retention periods | IO + legal advice | Medium |
| Establish data subject request procedure | IO | Medium |
| Review Vercel US transfer under POPIA s.72 | Legal advice | Medium |
| Formal security policy | IO + technical lead | Medium |

---

*This document must be reviewed by a qualified privacy or legal practitioner before being relied upon for compliance purposes.*
