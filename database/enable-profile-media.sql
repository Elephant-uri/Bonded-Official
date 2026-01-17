-- ============================================================================
-- Enable Profile Media Uploads
-- ============================================================================
-- This script enables users to upload profile avatars and photos to
-- the bonded-media storage bucket.
--
-- What it does:
-- 1. Ensures 'profile_photo' is in the media_type CHECK constraint
-- 2. Creates storage.objects policies for INSERT, UPDATE, and SELECT
-- 3. Creates public.media table policies for INSERT, UPDATE, and SELECT
--
-- Run this in Supabase SQL Editor before users can upload profile media.
-- Safe to run multiple times (uses IF NOT EXISTS checks).
-- ============================================================================

-- 1) Verify media_type constraint includes profile_photo
-- The constraint should already include profile_photo. Run this to check:
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'media_media_type_check';
--
-- If profile_photo is missing, run:
-- ALTER TABLE public.media DROP CONSTRAINT media_media_type_check;
-- ALTER TABLE public.media ADD CONSTRAINT media_media_type_check 
-- CHECK (media_type = ANY (ARRAY[
--   'profile_avatar'::text,
--   'profile_photo'::text,
--   'post'::text,
--   'story'::text,
--   'event_cover'::text,
--   'event_gallery'::text,
--   'org_logo'::text,
--   'org_cover'::text,
--   'message'::text
-- ]));

-- 2) Storage policy for profile avatar upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'users_upload_profile_avatar'
  ) THEN
    CREATE POLICY "users_upload_profile_avatar"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated'
      AND bucket_id = 'bonded-media'
      AND name LIKE 'universities/%/users/' || auth.uid()::text || '/profile/avatar.jpg'
    );
  END IF;
END $$;

-- 3) Storage policy for profile photo uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'users_upload_profile_photos'
  ) THEN
    CREATE POLICY "users_upload_profile_photos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated'
      AND bucket_id = 'bonded-media'
      AND name LIKE 'universities/%/users/' || auth.uid()::text || '/profile/photos/%'
    );
  END IF;
END $$;

-- 4) Media table RLS policy for inserting profile media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'media'
      AND policyname = 'users_insert_profile_media'
  ) THEN
    CREATE POLICY "users_insert_profile_media"
    ON public.media
    FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated'
      AND owner_type = 'user'
      AND owner_id = auth.uid()
      AND media_type IN ('profile_avatar', 'profile_photo')
    );
  END IF;
END $$;

-- 5) Media table RLS policy for reading profile media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'media'
      AND policyname = 'users_read_profile_media'
  ) THEN
    CREATE POLICY "users_read_profile_media"
    ON public.media
    FOR SELECT
    USING (
      media_type IN ('profile_avatar', 'profile_photo')
      AND (
        -- Users can read their own profile media
        (owner_type = 'user' AND owner_id = auth.uid())
        OR
        -- Users can read profile media from their university
        (EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.university_id = media.university_id
        ))
      )
    );
  END IF;
END $$;

-- 6) Media table RLS policy for updating own profile media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'media'
      AND policyname = 'users_update_profile_media'
  ) THEN
    CREATE POLICY "users_update_profile_media"
    ON public.media
    FOR UPDATE
    USING (
      auth.role() = 'authenticated'
      AND owner_type = 'user'
      AND owner_id = auth.uid()
      AND media_type IN ('profile_avatar', 'profile_photo')
    );
  END IF;
END $$;

-- 7) Storage policy for updating profile avatar (for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'users_update_profile_avatar'
  ) THEN
    CREATE POLICY "users_update_profile_avatar"
    ON storage.objects
    FOR UPDATE
    USING (
      auth.role() = 'authenticated'
      AND bucket_id = 'bonded-media'
      AND name LIKE 'universities/%/users/' || auth.uid()::text || '/profile/avatar.jpg'
    );
  END IF;
END $$;

-- 8) Storage policy for reading profile media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'users_read_profile_media'
  ) THEN
    CREATE POLICY "users_read_profile_media"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'bonded-media'
      AND (
        -- Users can read their own profile media
        name LIKE 'universities/%/users/' || auth.uid()::text || '/profile/%'
        OR
        -- Users can read profile media from users in their university
        EXISTS (
          SELECT 1 FROM profiles p1, profiles p2
          WHERE p1.id = auth.uid()
          AND p2.university_id = p1.university_id
          AND name LIKE 'universities/%/users/' || p2.id::text || '/profile/%'
        )
      )
    );
  END IF;
END $$;
