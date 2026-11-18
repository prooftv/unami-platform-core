# COGTA ArcGIS Access Investigation

**Date:** 2026-11-18  
**Status:** Confirmed — server-side firewall blocks query endpoints from external IPs

## Findings

### What works from external IPs
- TCP connection to `giswebmaps1.kzncogta.gov.za` (164.151.196.178) port 443 — succeeds
- TLS handshake — succeeds (TLSv1.3, valid certificate)
- Service root: `GET /server/rest/services?f=json` — HTTP 200, full response
- Layer metadata: `GET /FeatureServer/31?f=json` — HTTP 200, full response including capabilities

### What is blocked
- Feature queries: `GET /FeatureServer/31/query?...` — TCP connects, TLS succeeds, HTTP request sent, **0 bytes received, operation times out**
- This is not an authentication error (no 401/403 returned)
- This is not a rate limit (immediate timeout, not a 429)
- This is a server-side firewall silently dropping query requests from non-allowlisted IPs

### Layer metadata confirmed accessible
- Layer 31: Traditional Council Boundaries — `capabilities: Query,Create,Update,Delete,Uploads,Editing`
- The server advertises Query capability but the firewall prevents it from external IPs

### Server details
- IP: 164.151.196.178 (KZN Provincial Government network)
- Server: ArcGIS Server (Esri)
- TLS: TLSv1.3 / TLS_AES_256_GCM_SHA256

## What is needed

**IP allowlisting request to COGTA:**

Include in the request:
- Organisation: Unami Foundation NPC
- Purpose: Umkhandlu governance intelligence platform for Amajuba District
- Specific services required: ILIS_Base_map_2025 (layers 31, 46, 47, 50, 54, 55, 56), Ward_Profile_V3 (layer 3)
- Outbound IP of the Vercel deployment: determined at request time (Vercel uses dynamic IPs — a static egress IP via a proxy may be required)
- Reference: existing COGTA data permission request already submitted

**Note on Vercel dynamic IPs:**  
Vercel serverless functions do not have a fixed outbound IP. COGTA IP allowlisting requires a static IP. Options:
1. Route COGTA requests through a fixed-IP proxy (e.g. a small VPS or AWS NAT Gateway)
2. Request COGTA to allowlist a CIDR range (Vercel publishes their IP ranges)
3. Download datasets directly once permission is confirmed — no live query needed

**Recommended path:**  
Request data download permission alongside IP access. Downloaded GeoJSON/Shapefile datasets can be ingested via the existing pipeline staging workflow without requiring live query access. The arcgis-connector and pipeline infrastructure are ready.

## Current capability without query access
- Service catalogue and layer metadata: fully accessible
- Layer names, geometry types, field schemas, spatial references: readable
- Feature data: not accessible from Vercel deployment
- Workaround: manual download once COGTA permission confirmed, ingest via pipeline

## Actions required (human)
1. Follow up on existing COGTA data permission request — reference the submitted form
2. Request IP allowlisting OR data download permission in the same correspondence
3. If IP allowlisting: assess whether a static egress proxy is needed for Vercel
4. Do not submit a new request — reference the existing one
