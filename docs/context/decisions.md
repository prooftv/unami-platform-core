# Moments v2 — Key Decisions

Decisions that must not be reversed without explicit instruction.

## D-001: Single baseline migration
`supabase/migrations/000_initial_schema.sql` is the baseline.
Never modify it. All changes go in new numbered migration files.

## D-002: No custom auth tables
Supabase Auth replaces admin_users and admin_sessions entirely.
`admin_roles` maps Supabase Auth user IDs to application roles only.

## D-003: Edge Functions are the only DB layer
No direct Supabase calls from Next.js server components or API routes.
All data access flows through `supabase/functions/*` → `packages/api` → apps.

## D-004: packages/ui has no application knowledge
No Moments-specific terminology, no Supabase imports, no auth logic.
Must be equally usable by Moments, Spree Operations, BeatsChain, Umkhandlu.

## D-005: Fail-open authority system
Authority lookup errors never block WhatsApp message processing.
All authority callers handle null gracefully.

## D-006: Broadcasted moments are immutable
Once status = 'broadcasted', no edits and no deletes.
Enforced in Edge Functions, not just the database.

## D-007: Platform foundation is frozen at v0.1.0
No restructuring of packages/, no new abstraction layers, no new packages
unless a concrete application requirement demands it.

## D-008: Workspace and remote
All work in `/workspaces/unami-platform-core`.
All pushes to `origin` → `https://github.com/prooftv/unami-platform-core`.
The `moments-v2` directory is reference only — never edit it.

## D-009: Package scope rename deferred
Current scope is @moments/*. Will rename to @unami/* before second application onboards.
Do not rename during active Moments development.

## D-010: WhatsApp always returns 200
The webhook Edge Function always returns HTTP 200 to Meta.
Errors are logged to error_logs internally. Never surfaced to Meta.
