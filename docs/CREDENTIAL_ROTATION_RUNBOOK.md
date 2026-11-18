# Credential Rotation Runbook — R-SEC-01

**Date:** 2026-11-18  
**Trigger:** Supabase anon key, service role key, Intelligence API key, and SANITY_WEBHOOK_SECRET committed to public repository `unamibeatswap/gis-umkhandlu`

---

## Exposure scope

| Credential | Committed in | Exposure |
|---|---|---|
| Supabase anon key (JWT) | commits 109b6b0, e09b1f5, b70d5c9 | Public repo — treat as compromised |
| Supabase service role key (JWT) | commits 109b6b0, e09b1f5, b70d5c9 | Public repo — treat as compromised |
| Intelligence API key | commits 109b6b0, e09b1f5 | Public repo — treat as compromised |
| SANITY_WEBHOOK_SECRET | commits e09b1f5, b70d5c9 | Public repo — treat as compromised |
| GitHub PAT | NOT committed — session only | Not exposed via git |
| Vercel token | NOT committed — session only | Not exposed via git |
| Supabase management token | NOT committed — session only | Not exposed via git |
| FIELD_SUBMISSION_WEBHOOK_SECRET | NOT committed — session only | Not exposed via git |

---

## Step 1 — Rotate Supabase JWT secret (invalidates anon + service role keys)

1. Go to https://supabase.com/dashboard/project/ufsmpqxniswdnsywjzje/settings/api
2. Under "JWT Settings", click "Generate a new JWT secret"
3. Confirm the rotation — this immediately invalidates all existing JWTs
4. Copy the new anon key and service role key
5. Update Vercel environment variables:
   - `NEXT_PUBLIC_UMKHANDLU_SUPABASE_ANON_KEY` → new anon key
   - `UMKHANDLU_SUPABASE_SERVICE_ROLE_KEY` → new service role key
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → new anon key (if set separately)
   - `SUPABASE_SERVICE_ROLE_KEY` → new service role key (if set separately)
6. Trigger a new Vercel deployment to pick up the new keys
7. Verify: `curl https://unami-platform-core-umkhandlu.vercel.app/api/spatial/wards` returns 200

**Impact:** All active operator sessions will be invalidated. Operators will need to log in again.

---

## Step 2 — Rotate Intelligence API key

The Intelligence API key is used by the Control Centre to authenticate requests to the Governance Node's `/api/intelligence/*` endpoints.

1. Generate a new random key: `openssl rand -hex 32`
2. Update the Governance Node Vercel environment variable `INTELLIGENCE_API_KEY` to the new value
3. Update the Control Centre Vercel environment variable `UMKHANDLU_NODE_API_KEY` to the new value
4. Trigger redeployment of both applications
5. Verify: the Governance Node intelligence endpoints return 401 with the old key and 200 with the new key

---

## Step 3 — Rotate SANITY_WEBHOOK_SECRET

The SANITY_WEBHOOK_SECRET authenticates Sanity webhook deliveries to the Governance Node.

1. Go to https://www.sanity.io/manage/personal/project/60v9eb0r/api/webhooks
2. Find the webhook (ID: m5k8f8ULRcuL651E) and edit it
3. Generate a new secret and save
4. Update the Governance Node Vercel environment variable `SANITY_WEBHOOK_SECRET` to the new value
5. Trigger a new Governance Node deployment
6. Verify: Sanity webhook deliveries succeed (check webhook delivery logs in Sanity dashboard)

---

## Step 4 — Verify no active misuse

After rotation:
1. Check Supabase Auth logs for unexpected sign-ins: https://supabase.com/dashboard/project/ufsmpqxniswdnsywjzje/auth/users
2. Check Supabase API logs for unexpected queries: https://supabase.com/dashboard/project/ufsmpqxniswdnsywjzje/logs/api
3. Check Vercel deployment logs for unexpected requests
4. If any suspicious activity is found, escalate immediately

---

## Step 5 — Prevent future exposure

1. Make `unamibeatswap/gis-umkhandlu` repository **private** immediately
2. Add `.gitignore` entries for any files containing credentials
3. Consider adding GitHub secret scanning to `prooftv/unami-platform-core` and `prooftv/Umkhandlu`
4. Never store credentials in markdown files committed to any repository
5. Use environment variables or a secrets manager for all credentials

---

## Step 6 — Git history

The exposed commits remain in the public repository history. After credentials are rotated (making the exposed values useless), assess whether to:
- Leave history as-is (rotated credentials are harmless)
- Archive or delete the `unamibeatswap/gis-umkhandlu` repository if it serves no ongoing purpose

Do not rewrite history on `prooftv/unami-platform-core` or `prooftv/Umkhandlu` — the credentials were never committed there.

---

## Verification checklist

- [ ] Supabase JWT secret rotated
- [ ] New anon key set in Vercel
- [ ] New service role key set in Vercel
- [ ] Vercel redeployment triggered and READY
- [ ] `/api/spatial/wards` returns 200 with new keys
- [ ] Intelligence API key rotated in both applications
- [ ] SANITY_WEBHOOK_SECRET rotated in Sanity and Governance Node
- [ ] No suspicious activity found in logs
- [ ] `gis-umkhandlu` repository made private
- [ ] AGENT_NOTES.md updated to remove all credential values
