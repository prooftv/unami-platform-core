-- D2: Create Supabase Storage bucket for child identity photographs
--
-- The bucket is created via Supabase Storage API (not plain SQL).
-- This migration documents the required bucket configuration.
-- Run the INSERT below only if using Supabase's storage schema directly;
-- otherwise create the bucket via the Supabase dashboard or CLI:
--
--   supabase storage create children-photos --public false
--
-- Access policy (enforced by RLS on storage.objects):
--   - parent/admin: INSERT (upload own children's photos)
--   - parent/school/authority/admin: SELECT (read)
--   - community: no access
--   - public: no access
--
-- The photo_url column already exists on uncip_children (migration 009).
-- No schema change to uncip_children is required.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'children-photos',
  'children-photos',
  false,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage.objects for children-photos bucket
-- Authenticated users with appropriate UNCIP role may read.
-- Only parent and admin may upload.

CREATE POLICY "uncip_children_photos_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'children-photos'
    AND (uncip_current_profile()).role IN ('admin','parent','school','authority')
  );

CREATE POLICY "uncip_children_photos_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'children-photos'
    AND (uncip_current_profile()).role IN ('admin','parent')
  );

CREATE POLICY "uncip_children_photos_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'children-photos'
    AND (uncip_current_profile()).role = 'admin'
  );
