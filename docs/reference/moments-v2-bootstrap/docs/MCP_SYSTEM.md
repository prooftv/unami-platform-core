# MCP Content Intelligence — Full Specification

## What MCP Means in This System
MCP (Moderation & Content Processing) is the content intelligence layer.
It is NOT an external service — it runs as a Supabase SQL function with an
optional Claude API enhancement layer. The name comes from the original
"MCP Advisory" concept but the implementation is fully native.

---

## Architecture

```
Inbound message
      │
      ▼
mcp_advisory() SQL function (always runs, < 5ms)
      │
      ├── Harm detection (regex, SA-specific patterns)
      ├── Spam detection (scam/fraud patterns)
      ├── Urgency classification
      └── Returns JSONB: confidence, harm_signals, spam_indicators, urgency_level
      │
      ▼ (if ANTHROPIC_API_KEY set)
Claude claude-3-haiku API (async, enriches result)
      │
      ├── Structured JSON prompt
      ├── SA community context
      ├── Falls back to SQL result on any error
      └── Merges with SQL result
      │
      ▼
Store in advisories table
      │
      ▼
Apply authority threshold
      │
      ├── confidence < threshold → auto-approve, create draft moment
      └── confidence > 0.7 → escalate_suggested=true, admin queue
```

---

## SQL Function: mcp_advisory()

Parameters:
- message_content TEXT
- message_language TEXT (default 'eng')
- message_type TEXT (default 'text')
- from_number TEXT (default NULL)
- message_timestamp TIMESTAMPTZ (default NOW())

Returns: JSONB

### Harm Detection Patterns
```sql
-- High confidence (0.95): direct violence
content ~* '(kill|murder|attack|bomb|weapon|gun|knife|violence|assault|rape|suicide)'

-- Medium-high (0.75): threats
content ~* '(threat|harm|hurt|destroy|fight|beat|stab)'

-- Medium (0.70): hate speech
content ~* '(hate|racist|discrimination)'

-- Default: 0.05 (safe)
```

### Spam Detection Patterns
```sql
-- Very short messages (0.85)
length(content) < 5

-- Classic scam phrases (0.90)
content ~* '(click here|buy now|limited time|act now|urgent|winner|prize|lottery|bitcoin|investment|forex|crypto)'

-- Financial fraud with links (0.85)
content ~* '(whatsapp\.me|wa\.me|t\.me|bit\.ly)' AND content ~* '(money|cash|earn|profit)'

-- Medical spam (0.95)
content ~* '(viagra|pills|medication|pharmacy)'

-- Bank fraud (0.80)
content ~ '(\d{10,})' AND content ~* '(bank|account|transfer|send money)'

-- Very long messages (0.60)
length(content) > 1000

-- Default: 0.10 (legitimate)
```

### Urgency Classification
```
harm_confidence > 0.8 OR spam_confidence > 0.8 → 'urgent'
harm_confidence > 0.6 OR spam_confidence > 0.6 → 'high'
harm_confidence > 0.4 OR spam_confidence > 0.4 → 'medium'
default → 'low'
```

### Return Structure
```json
{
  "harm_signals": {
    "confidence": 0.05,
    "detected": false,
    "type": "safe"
  },
  "spam_indicators": {
    "confidence": 0.10,
    "detected": false,
    "type": "legitimate"
  },
  "urgency_level": "low",
  "overall_confidence": 0.10,
  "escalation_suggested": false,
  "language": "eng",
  "analyzed_at": "2024-01-01T00:00:00Z"
}
```

---

## Claude API Enhancement

### When It Runs
- Only if ANTHROPIC_API_KEY environment variable is set
- Only if feature_flags.claude_analysis_enabled = true
- Runs async after SQL analysis
- Falls back to SQL result on any error (fail-open)

### Model
- claude-3-haiku-20240307 (fast, cheap, sufficient for moderation)
- max_tokens: 300
- Temperature: default (0)

### Prompt Template
```
Analyze this South African community message for moderation.
Return ONLY valid JSON with:
- confidence: 0-1 risk score (0=safe, 1=harmful)
- harm_signals: {violence: bool, harassment: bool, scam: bool, hate_speech: bool}
- spam_indicators: {promotional: bool, repetitive: bool, links: bool, financial_fraud: bool}
- urgency_level: "low" | "medium" | "high"

Consider South African context: multilingual (Zulu, Xhosa, Sotho, Afrikaans),
community-focused content, local idioms and expressions.

Message: "{content}"

JSON only, no explanation:
```

### Result Merging
Claude result takes precedence over SQL result when available.
If Claude fails: SQL result used as-is.

---

## Advisory Storage

Every analyzed message gets an advisory record:
```sql
INSERT INTO advisories (
  message_id,
  advisory_type,    -- 'content_quality'
  confidence,       -- overall_confidence from MCP
  harm_signals,     -- JSONB
  spam_indicators,  -- JSONB
  urgency_level,
  escalation_suggested,
  details           -- full MCP output
)
```

---

## Auto-Approval Logic

```typescript
const threshold = authorityContext?.risk_threshold || 0.3
const autoApprove = mcpAnalysis.confidence < threshold

if (autoApprove) {
  // Update message status
  await supabase.from('messages')
    .update({ moderation_status: 'approved' })
    .eq('id', messageRecord.id)

  // Create draft moment for admin to review/broadcast
  await supabase.from('moments').insert({
    title: content.substring(0, 50),
    content: content,
    region: 'National',
    category: 'Community',
    status: 'draft',
    created_by: 'auto_moderation',
    content_source: 'whatsapp'
  })

  // Log in moderation_audit
  await supabase.from('moderation_audit').insert({
    message_id: messageRecord.id,
    action: 'approved',
    moderator: 'system_auto',
    reason: `Auto-approved: confidence=${confidence.toFixed(2)} < threshold=${threshold}`
  })
}
```

---

## Escalation Logic

```typescript
if (mcpAnalysis.confidence > 0.7) {
  // advisory.escalation_suggested = true (already set)
  // Message appears in admin moderation queue with red badge
  // No automatic action — human decides
  // Optional: trigger n8n alert workflow
}
```

---

## Admin Moderation Queue Integration

The moderation queue in the admin dashboard shows:
- All messages with their advisory confidence scores
- Color coding: green (< 0.3) / yellow (0.3-0.7) / red (> 0.7)
- Filter: All / Pending / Flagged / High Risk / Escalated / Auto-approved
- Actions: Approve (creates moment) / Flag / Reject
- All actions logged in moderation_audit

---

## MCP for Admin-Created Moments

When an admin creates a moment, a pending advisory is also created:
```sql
-- Trigger: moments_mcp_trigger
INSERT INTO advisories (moment_id, advisory_type, confidence, details)
VALUES (NEW.id, 'content_quality', 0.8, '{"status": "pending_analysis"}')
```

This allows the compliance check endpoint to analyze admin content too.

---

## Compliance Check Endpoint

POST /compliance/check — used by admin dashboard before broadcasting.

Rule-based check (not MCP):
```typescript
const prohibited = [
  'vote', 'election', 'political party',
  'loan', 'investment', 'cryptocurrency',
  'cure', 'treatment',
  'gambling', 'bet', 'lottery'
]

// Each prohibited term: +30 risk score
// Restricted categories: +20 risk score
// risk_score >= 70: SUSPEND
// risk_score >= 40: WARN (requires approval)
// risk_score < 40: SAFE
```

---

## Language Detection

The system detects South African languages:
- eng: English
- zul: isiZulu
- xho: isiXhosa
- afr: Afrikaans
- sot: Sesotho
- tsn: Setswana

Detection uses the `franc` library (lightweight, works offline).
Stored in messages.language_detected.
Used for: routing to language-appropriate templates, analytics.

---

## Future MCP Enhancements (not built yet)

- Per-language harm pattern libraries (Zulu, Xhosa specific)
- Community reputation scoring (trusted senders get lower threshold)
- Pattern learning from human moderation decisions
- Bulk re-analysis of historical messages
- Real-time moderation dashboard with live updates
