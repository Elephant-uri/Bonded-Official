-- Enable post media uploads for bonded-media.
-- Run in Supabase SQL editor.

-- 1) Ensure media_type enum supports "post"
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumlabel = 'post'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'media_type')
    ) THEN
      ALTER TYPE media_type ADD VALUE 'post';
    END IF;
  END IF;
END $$;

-- 2) Storage policy for user post media uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'users_upload_post_media'
  ) THEN
    CREATE POLICY "users_upload_post_media"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated'
      AND bucket_id = 'bonded-media'
      AND name LIKE 'universities/%/users/' || auth.uid()::text || '/posts/%'
    );
  END IF;
END $$;
