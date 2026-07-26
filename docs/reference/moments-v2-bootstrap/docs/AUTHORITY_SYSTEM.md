# Dynamic Authority Layer — Full Specification

## Purpose
Allow trusted community members — NGO partners, community leaders, journalists,
verified organizations — to have elevated content privileges without being full
admins. The system is additive (authority enriches, never gates) and fail-open
(errors never block processing).

---

## Core Concept

Standard WhatsApp user:
- Content goes to admin moderation queue
- Blast radius: 0 (cannot broadcast directly)
- Risk threshold: 0.3 (default auto-approve threshold)

Authority user (e.g., NGO Partner, Level 3):
- Content auto-approved if MCP confidence < their risk_threshold
- Blast radius: 500 (their content reaches up to 500 subscribers)
- Scope: province (their content tagged to their province)
- Approval mode: ai_review (MCP decides, not admin)

---

## Authority Levels

| Level | Label | Typical Role | Blast Radius | Approval Mode |
|---|---|---|---|---|
| 1 | Community Member | Regular user | 100 | admin_review |
| 2 | Verified Member | Verified community contributor | 250 | ai_review |
| 3 | Community Leader | Local leader, ward councillor | 500 | ai_review |
| 4 | NGO Partner | Registered NGO, verified org | 1000 | auto |
| 5 | National Authority | Government dept, major NGO | 10000 | auto |

---

## Scope Types

| Scope | Description | scope_identifier |
|---|---|---|
| community | Local area only | Neighbourhood name |
| region | Specific region | e.g., "Soweto" |
| province | Specific province | KZN/WC/GP/EC/FS/LP/MP/NC/NW |
| national | All regions | null |

---

## Approval Modes

| Mode | Behavior |
|---|---|
| admin_review | All content goes to admin moderation queue |
| ai_review | MCP decides. Only high-confidence flags go to admin |
| auto | Content auto-approved if below risk_threshold |

---

## How Authority Affects Broadcasting

### Blast Radius Enforcement
```typescript
// In broadcast.ts
const subscribers = await getSubscribers(moment.region)
const blastRadius = authorityContext?.blast_radius || 100
const filtered = subscribers.slice(0, blastRadius)
// Only filtered subscribers receive the broadcast
```

### Scope Filtering
```typescript
// Province-scoped authority
if (authority.scope === 'province' && authority.scope_identifier) {
  // Moment must be tagged to their province
  // Subscribers filtered to that province
}
// National authority: no filtering
```

### Template Selection
```typescript
if (authority.authority_level >= 4) {
  template = 'official_announcement_v1'
} else if (moment.sponsor_id) {
  template = 'verified_sponsored_v1'
} else {
  template = 'community_moment_v1'
}
```

---

## How Authority Affects Moderation

### Risk Threshold
```typescript
// Default threshold: 0.3
// Authority user threshold: their risk_threshold (can be lower = more permissive)
const threshold = authorityContext?.risk_threshold || 0.3
const autoApprove = mcpAnalysis.confidence < threshold
```

### Auto-Approval with Authority
```typescript
if (authority.approval_mode === 'auto' && mcpAnalysis.confidence < authority.risk_threshold) {
  // Auto-approve without admin review
  // Create draft moment immediately
  // Log: "Auto-approved by authority level 4"
}
```

---

## Authority Lookup

### Database Function
```sql
CREATE OR REPLACE FUNCTION lookup_authority(p_user_identifier TEXT)
RETURNS TABLE (
  id UUID,
  user_identifier TEXT,
  authority_level INTEGER,
  role_label TEXT,
  scope TEXT,
  scope_identifier TEXT,
  approval_mode TEXT,
  blast_radius INTEGER,
  risk_threshold DECIMAL,
  status TEXT,
  valid_until TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT ap.*
  FROM authority_profiles ap
  WHERE ap.user_identifier = p_user_identifier
    AND ap.status = 'active'
    AND (ap.valid_until IS NULL OR ap.valid_until > NOW())
  ORDER BY ap.authority_level DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### In-Memory Cache (5-minute TTL)
```typescript
const cache = new Map<string, { data: Authority | null, timestamp: number }>()
const TTL = 5 * 60 * 1000

async function lookupAuthority(identifier: string): Promise<Authority | null> {
  const cached = cache.get(identifier)
  if (cached && Date.now() - cached.timestamp < TTL) return cached.data

  try {
    const { data } = await supabase.rpc('lookup_authority', { p_user_identifier: identifier })
    const result = data?.[0] || null
    cache.set(identifier, { data: result, timestamp: Date.now() })
    return result
  } catch {
    return null // Fail-open
  }
}
```

---

## Authority Audit Trail

Every authority action is logged:
```typescript
await supabase.rpc('log_authority_action', {
  p_authority_profile_id: profile.id,
  p_action: 'created' | 'updated' | 'suspended' | 'enforced',
  p_actor_id: adminUserId,
  p_context: { reason, changes, moment_id, blast_radius_applied }
})
```

Actions logged:
- created: new authority profile created
- updated: profile fields changed
- suspended: profile suspended by admin
- enforced: authority applied to a broadcast (with blast_radius_applied)

---

## Admin UI for Authority Management

### List View
- Table: user_identifier (masked), role_label, level badge, scope, blast_radius, status
- Filter by: status (active/suspended/expired), scope, level
- Actions: Edit, Suspend, View Audit Log

### Create/Edit Form
- User Identifier: phone number input
- Authority Level: 1-5 slider with label preview
- Role Label: text input ("Community Leader", "NGO Partner", etc.)
- Scope: dropdown (community/region/province/national)
- Scope Identifier: conditional text input (shown when scope=province/region)
- Approval Mode: radio buttons with descriptions
- Blast Radius: number input (1-10000)
- Risk Threshold: 0.1-0.9 slider (lower = more permissive)
- Valid Until: date picker (optional, leave blank for permanent)

### Suspend Flow
- Confirm dialog: "Suspend authority for +27...?"
- Reason input (required)
- Immediate effect (cache cleared)
- Logged in authority_audit_log

---

## MYAUTHORITY WhatsApp Command

When a user with an authority profile sends MYAUTHORITY:
```
👑 Unami Foundation Moments App

Your Authority:

Level: 3
Role: Community Leader
Scope: Province (KZN)
Reach: 500 subscribers
Approval: AI Review
```

With interactive buttons: My Stats / Help / Done

---

## Fail-Open Guarantee

The authority system MUST NEVER block message processing.

```typescript
// Every authority call is wrapped:
let authorityContext = null
try {
  authorityContext = await lookupAuthority(phoneNumber)
} catch (error) {
  console.warn('Authority lookup failed (non-blocking):', error.message)
  // authorityContext remains null
  // Processing continues with default behavior
}

// All authority checks handle null:
const blastRadius = authorityContext?.blast_radius ?? 100
const threshold = authorityContext?.risk_threshold ?? 0.3
```

---

## Use Cases

### NGO Partner (Level 4, Province Scope)
- Organization: "Durban Community Trust"
- scope: province, scope_identifier: KZN
- blast_radius: 1000
- approval_mode: auto
- risk_threshold: 0.4
- Effect: Their WhatsApp messages auto-approved if MCP < 0.4, broadcast to up to 1000 KZN subscribers

### Community Leader (Level 3, Region Scope)
- Person: Ward councillor in Soweto
- scope: region, scope_identifier: Soweto
- blast_radius: 300
- approval_mode: ai_review
- risk_threshold: 0.5
- Effect: Their content reviewed by MCP only (not admin), reaches up to 300 subscribers

### National Authority (Level 5)
- Organization: Government department
- scope: national
- blast_radius: 10000
- approval_mode: auto
- risk_threshold: 0.6
- template: official_announcement_v1
- Effect: Content auto-approved, reaches up to 10000 subscribers nationally, uses official template
