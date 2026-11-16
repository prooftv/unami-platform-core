# Umkhandlu GIS and governance delivery report

**Wrap-up: 2026-11-16**

## Repository delivery

| Repository | Branch / commit | Push and deployment |
|---|---|---|
| Control Centre — `prooftv/unami-platform-core` | `main` / `61c2fc0c8de95f469ec39f22ced5151a0e2ac307` | Pushed; `unami-platform-core-umkhandlu` Vercel check reports deployment complete. |
| Governance Node — `prooftv/Umkhandlu` | `trunk` / `f4cb1510210662aba8a60ab8f5838658399cf61c` | Pushed; both `umkhandlu` and `umkhandlu-dlamini` Vercel checks report deployment complete. |

No Governance Node source changes were needed for this wrap-up. No changes were made to the GIS MCP repository, Moments, or UNCIP.

## Control Centre migrations and production verification

The verified Supabase target is project `Umkhandlu` (`ufsmpqxniswdnsywjzje`), identified by the Supabase CLI as **production**.

### Applied and verified

- Production migration history lists `000`, `001`, `002`, and `014` through `018` as applied.
- Spatial migrations `014` and `015` were previously applied and verified against staging-table permissions, source feature identity, and the GratisGIS pipeline type.
- The production effects of `016` and `017` were previously checked before recording those versions as applied.
- Added and applied `018_restrict_spatial_permission_changes.sql`. It revokes all table privileges on `public.spatial_permission_changes` from `PUBLIC`, `anon`, and `authenticated`, preserves `service_role` access, and limits the table's `ALL` RLS policy to `service_role`.
- Read-only production catalog checks after `018` confirm that `anon` and `authenticated` have no `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, or `TRIGGER` privileges on `spatial_permission_changes`; `service_role` retains those privileges. Migration `018` is present in the production migration ledger.
- Production schema inspection also confirmed the relevant spatial tables and metadata columns, staging feature identity, notice/risk linkage columns and foreign keys, the public governance-node view, and server-side notice/node functions. Public grants and function execute privileges were checked; the inspected server-side functions are not executable by `anon` or `authenticated`.
- The 018 SQL file was pushed in Control Centre commit `61c2fc0c8de95f469ec39f22ced5151a0e2ac307`. No feature, notice, source, or dataset rows were changed by it.

### Why the remaining migration entries were not blindly applied

- Root migrations `003`–`013` are absent from production history, but the root lineage includes participation, evidence, commercial, platform-record, WhatsApp, community-record, and UNCIP changes. The supplied scope explicitly excludes unrelated Moments and UNCIP work.
- The separate `apps/umkhandlu/supabase/migrations` tree contains different SQL with overlapping version numbers, including two distinct `003` files and two distinct `005` files. Production migration versions alone therefore do not identify which file was applied. Both migration directories also lack a separate application-level project configuration; the root `config.toml` identifies `moments-v2`, while the explicit remote lookup identified production Umkhandlu.
- The production catalogue confirms many expected Umkhandlu GIS objects and later schema effects exist, but that is not sufficient evidence to mark every colliding historical migration as applied: some contain seed/data changes, and some include security/policy operations. No migration repair for `003`–`013`, no broad migration replay, and no unrelated project changes were made.
- The next safe database step is to reconcile the two migration lineages and their data-seed history in the Control Centre repository, then create a single unambiguous forward-only migration path for any verified missing Umkhandlu changes. Keep `moments-v2` and UNCIP migration files out of the Umkhandlu deployment.
- Legacy migration files `001` and `002` contain an embedded governance-node credential. They were not re-executed; rotate the affected credential through the approved owner workflow. No credential value is reproduced here.

## Validation and deployment

- Control Centre spatial tests: GratisGIS client **2**, coverage review **5**, permissions **30**, and spatial API **9** passed (**46 total**).
- Governance Node: **35 tests** passed; `npm run typecheck` passed.
- Governance Node's local full production build previously ended with `SIGTERM`; it is not claimed as a local build pass. GitHub reports the deployed Vercel checks for both Governance Node projects as successful.
- The Control Centre Vercel check for `unami-platform-core-umkhandlu` completed successfully for its current pushed commit.

## Remaining integration and launch-readiness blockers

- No verified persistent GratisGIS endpoint/authentication contract is available in the checked configuration. Do not treat the public demo as the production service; no live production GratisGIS connection is claimed.
- The operator token required for protected Control Centre integrity workflows remains unavailable or unverified.
- Source/dataset authority and licence metadata still have gaps. The DPME authority classification requires operator/source confirmation.
- The Amajuba-labelled Giga collection's reported geometry coverage remains inconsistent; the out-of-district features require source-owner review before any correction or Amajuba-only publication claim.
- The application's live spatial UI and all desktop/mobile operator workflows were not re-tested in this wrap-up. Successful deployment checks do not prove those user journeys.
- Migration lineage `003`–`013` remains unresolved as described above. This is an explicit migration-governance blocker, not a claim that every historical migration was applied.

## Outcome

The two application branches are synchronized with their intended remotes, and their current Umkhandlu Vercel checks are successful. The applicable GIS privilege correction is deployed and verified against the production database. The system is **not declared fully launch-ready**: persistent GratisGIS connectivity, protected operator access, source/licence reconciliation, end-to-end UI verification, and safe historical migration-lineage reconciliation remain open.
