-- Migration 007: WhatsApp template management tables
-- Adds: whatsapp_templates, template_messages, messaging_windows
-- These tables track template approval state, per-recipient delivery audit,
-- and 24-hour messaging window state. They do not duplicate moment content.

-- ---------------------------------------------------------------------------
-- whatsapp_templates
-- Local registry of Meta-approved templates. Source of truth for approval status.
-- ---------------------------------------------------------------------------

CREATE TABLE whatsapp_templates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        UNIQUE NOT NULL,
  category          TEXT        NOT NULL CHECK (category IN ('UTILITY', 'MARKETING')),
  language_code     TEXT        NOT NULL DEFAULT 'en',
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
  header_type       TEXT        CHECK (header_type IN ('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT')),
  header_text       TEXT,
  body_text         TEXT        NOT NULL,
  footer_text       TEXT,
  button_type       TEXT        CHECK (button_type IN ('URL', 'QUICK_REPLY')),
  button_label      TEXT,
  button_url        TEXT,
  variable_count    INTEGER     NOT NULL DEFAULT 0 CHECK (variable_count >= 0),
  meta_template_id  TEXT,
  submitted_at      TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed: 5 known templates. UTILITY templates seeded as approved (transactional).
-- MARKETING templates seeded as pending — require Meta approval before use.
INSERT INTO whatsapp_templates
  (name, category, language_code, status, body_text, footer_text, variable_count)
VALUES
  (
    'welcome_confirmation',
    'UTILITY',
    'en',
    'approved',
    E'Welcome to Unami Foundation Moments! \U0001F31F\n\nYou''re now subscribed to community updates for {{1}}.\n\nCategories: {{2}}\n\nReply STOP anytime to unsubscribe.',
    'Unami Foundation - Empowering Communities',
    2
  ),
  (
    'unsubscribe_confirmation',
    'UTILITY',
    'en',
    'approved',
    E'You have been unsubscribed from Unami Foundation Moments.\n\nReply START anytime to resubscribe.\n\nThank you for being part of our community! \U0001F64F',
    NULL,
    0
  ),
  (
    'moment_broadcast',
    'MARKETING',
    'en',
    'pending',
    E'{{3}}\n\n{{4}}\n\n\U0001F3F7\uFE0F {{5}} \u2022 \U0001F4CD {{6}}\n\n\U0001F310 More: https://moments.unamifoundation.org',
    'Reply STOP to unsubscribe',
    6
  ),
  (
    'sponsored_moment',
    'MARKETING',
    'en',
    'pending',
    E'{{3}}\n\n{{4}}\n\n\U0001F3F7\uFE0F {{5}} \u2022 \U0001F4CD {{6}}\n\n\u2728 Proudly sponsored by {{7}}\n\n\U0001F310 More: https://moments.unamifoundation.org',
    'Reply STOP to unsubscribe',
    8
  ),
  (
    'subscription_preferences',
    'UTILITY',
    'en',
    'pending',
    E'Your Moments subscription preferences have been updated.\n\nRegions: {{1}}\nCategories: {{2}}\nDelivery: {{3}}\n\nReply HELP for all commands.',
    'Unami Foundation - Empowering Communities',
    3
  );

-- ---------------------------------------------------------------------------
-- template_messages
-- Per-recipient audit log of every template send. Append-only except for
-- status/delivered_at/read_at updates from delivery receipt webhooks.
-- ---------------------------------------------------------------------------

CREATE TABLE template_messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id     UUID        NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  moment_id        UUID        NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  template_name    TEXT        NOT NULL,
  phone_number     TEXT        NOT NULL,
  variables        JSONB       NOT NULL DEFAULT '{}',
  meta_message_id  TEXT,
  status           TEXT        NOT NULL DEFAULT 'sent'
                               CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  error_code       TEXT,
  error_message    TEXT,
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at     TIMESTAMPTZ,
  read_at          TIMESTAMPTZ
);

CREATE INDEX idx_template_messages_broadcast_id ON template_messages(broadcast_id);
CREATE INDEX idx_template_messages_moment_id    ON template_messages(moment_id);
CREATE INDEX idx_template_messages_phone_number ON template_messages(phone_number);
CREATE INDEX idx_template_messages_status       ON template_messages(status);
CREATE INDEX idx_template_messages_sent_at      ON template_messages(sent_at);

-- ---------------------------------------------------------------------------
-- messaging_windows
-- Tracks the 24-hour customer service window per phone number.
-- Upserted on every inbound message. window_expires_at maintained by trigger.
-- Broadcasts never consult this table — they always use MARKETING templates.
-- ---------------------------------------------------------------------------

CREATE TABLE messaging_windows (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number      TEXT        UNIQUE NOT NULL,
  last_inbound_at   TIMESTAMPTZ NOT NULL,
  window_expires_at TIMESTAMPTZ NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messaging_windows_phone_number    ON messaging_windows(phone_number);
CREATE INDEX idx_messaging_windows_window_expires  ON messaging_windows(window_expires_at);

-- Trigger: keep window_expires_at = last_inbound_at + 24 hours automatically
CREATE OR REPLACE FUNCTION set_messaging_window_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.window_expires_at := NEW.last_inbound_at + INTERVAL '24 hours';
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_messaging_window_expiry
  BEFORE INSERT OR UPDATE ON messaging_windows
  FOR EACH ROW EXECUTE FUNCTION set_messaging_window_expiry();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE whatsapp_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging_windows   ENABLE ROW LEVEL SECURITY;

-- whatsapp_templates: authenticated read, service_role full access
CREATE POLICY "authenticated read whatsapp_templates"
  ON whatsapp_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role all whatsapp_templates"
  ON whatsapp_templates FOR ALL TO service_role USING (true);

-- template_messages: authenticated read, service_role full access
CREATE POLICY "authenticated read template_messages"
  ON template_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role all template_messages"
  ON template_messages FOR ALL TO service_role USING (true);

-- messaging_windows: service_role only (phone numbers are PII)
CREATE POLICY "service_role all messaging_windows"
  ON messaging_windows FOR ALL TO service_role USING (true);
