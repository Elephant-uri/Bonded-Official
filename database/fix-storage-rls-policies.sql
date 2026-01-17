-- ============================================================================
-- STORAGE RLS POLICIES FOR BONDED-MEDIA BUCKET
-- ============================================================================
-- This script adds Row Level Security policies for the bonded-media storage bucket
-- Run this in your Supabase SQL Editor
--
-- Bucket structure: bonded-media/universities/{university_id}/users/{user_id}/{type}/{filename}
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: ENSURE BUCKET EXISTS
-- ============================================================================

-- Create bucket if it doesn't exist (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bonded-media',
  'bonded-media',
  false, -- Not public - requires signed URLs
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- PART 2: DROP EXISTING POLICIES
-- ============================================================================

-- Drop all existing policies on bonded-media bucket to start clean
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read from their university" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "bonded_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "bonded_media_select" ON storage.objects;
DROP POLICY IF EXISTS "bonded_media_update" ON storage.objects;
DROP POLICY IF EXISTS "bonded_media_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to bonded-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from bonded-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own bonded-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own bonded-media" ON storage.objects;

-- ============================================================================
-- PART 3: CREATE NEW STORAGE POLICIES
-- ============================================================================

-- POLICY 1: INSERT (Upload)
-- Users can upload files to their own folder within their university
CREATE POLICY "bonded_media_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bonded-media'
  AND
  -- Path must start with universities/{university_id}/users/{user_id}/
  -- Extract user_id from path (format: universities/uuid/users/uuid/...)
  (storage.foldername(name))[3] = auth.uid()::text
);

-- POLICY 2: SELECT (Download/Read)
-- Users can read files from their own university
CREATE POLICY "bonded_media_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'bonded-media'
  AND
  (
    -- Can read their own files
    (storage.foldername(name))[3] = auth.uid()::text
    OR
    -- Can read files from their university (check profiles table)
    EXISTS (
      SELECT 1
      FROM public.profiles AS p1
      CROSS JOIN public.profiles AS p2
      WHERE p1.id = auth.uid()
        AND p2.id = ((storage.foldername(name))[3])::uuid
        AND p1.university_id IS NOT NULL
        AND p1.university_id = p2.university_id
    )
  )
);

-- POLICY 3: UPDATE
-- Users can update their own files
CREATE POLICY "bonded_media_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bonded-media'
  AND (storage.foldername(name))[3] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'bonded-media'
  AND (storage.foldername(name))[3] = auth.uid()::text
);

-- POLICY 4: DELETE
-- Users can delete their own files
CREATE POLICY "bonded_media_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'bonded-media'
  AND (storage.foldername(name))[3] = auth.uid()::text
);

-- ============================================================================
-- PART 4: FIX MEDIA TABLE RLS POLICIES
-- ============================================================================

-- Drop existing media table policies
DROP POLICY IF EXISTS "media_insert" ON public.media;
DROP POLICY IF EXISTS "media_select" ON public.media;
DROP POLICY IF EXISTS "media_update" ON public.media;
DROP POLICY IF EXISTS "media_delete" ON public.media;
DROP POLICY IF EXISTS "Users can insert media records" ON public.media;
DROP POLICY IF EXISTS "Users can read media from their university" ON public.media;
DROP POLICY IF EXISTS "Users can update their own media" ON public.media;
DROP POLICY IF EXISTS "Users can delete their own media" ON public.media;

-- POLICY 1: INSERT (Create media records)
-- Users can insert media records for content they create
CREATE POLICY "media_insert"
ON public.media
FOR INSERT
TO authenticated
WITH CHECK (
  -- For user-owned media (profiles, posts, stories)
  (owner_type = 'user' AND owner_id = auth.uid())
  OR
  -- For org-owned media (check org membership)
  (owner_type = 'org' AND EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = media.owner_id
    AND user_id = auth.uid()
  ))
  OR
  -- For event-owned media (check if user is organizer)
  (owner_type = 'event' AND EXISTS (
    SELECT 1 FROM public.uri_events
    WHERE id = media.owner_id
    AND organizer_id = auth.uid()
  ))
);

-- POLICY 2: SELECT (Read media records)
-- Users can read media from their university
CREATE POLICY "media_select"
ON public.media
FOR SELECT
TO authenticated
USING (
  -- Can read media from their own university
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND university_id = media.university_id
  )
);

-- POLICY 3: UPDATE (Update media metadata)
-- Users can update their own media
CREATE POLICY "media_update"
ON public.media
FOR UPDATE
TO authenticated
USING (
  (owner_type = 'user' AND owner_id = auth.uid())
  OR
  (owner_type = 'org' AND EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = media.owner_id
    AND user_id = auth.uid()
  ))
  OR
  (owner_type = 'event' AND EXISTS (
    SELECT 1 FROM public.uri_events
    WHERE id = media.owner_id
    AND organizer_id = auth.uid()
  ))
)
WITH CHECK (
  (owner_type = 'user' AND owner_id = auth.uid())
  OR
  (owner_type = 'org' AND EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = media.owner_id
    AND user_id = auth.uid()
  ))
  OR
  (owner_type = 'event' AND EXISTS (
    SELECT 1 FROM public.uri_events
    WHERE id = media.owner_id
    AND organizer_id = auth.uid()
  ))
);

-- POLICY 4: DELETE (Remove media records)
-- Users can delete their own media
CREATE POLICY "media_delete"
ON public.media
FOR DELETE
TO authenticated
USING (
  (owner_type = 'user' AND owner_id = auth.uid())
  OR
  (owner_type = 'org' AND EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = media.owner_id
    AND user_id = auth.uid()
  ))
  OR
  (owner_type = 'event' AND EXISTS (
    SELECT 1 FROM public.uri_events
    WHERE id = media.owner_id
    AND organizer_id = auth.uid()
  ))
);

-- ============================================================================
-- PART 5: GRANT PERMISSIONS
-- ============================================================================

-- Ensure authenticated users can access storage.objects
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

-- Ensure authenticated users can access media table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run these separately to test)
-- ============================================================================

-- Test 1: Check if bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'bonded-media';

-- Test 2: Check all policies on bonded-media bucket
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE tablename = 'objects'
--   AND (
--     qual LIKE '%bonded-media%'
--     OR with_check LIKE '%bonded-media%'
--     OR policyname LIKE '%bonded_media%'
--   )
-- ORDER BY policyname;

-- Test 3: Try uploading a file (do this from your app)
-- The path should be: universities/{university_id}/users/{user_id}/profile_photos/photo.jpg

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. Path Structure:
--    - Format: universities/{university_id}/users/{user_id}/{media_type}/{filename}
--    - Example: universities/2bd8dc28-bdd7-4505-80a4-f44aa6617c05/users/ef63dc9c-cae6-4b1f-9f4b-9dedec6013e9/profile_photos/1234567890.jpg
--
-- 2. storage.foldername(name) returns an array of path segments:
--    - [0]: 'universities'
--    - [1]: university_id
--    - [2]: 'users'
--    - [3]: user_id
--    - [4]: media_type
--
-- 3. Security:
--    - Users can only upload to their own folder
--    - Users can read files from anyone in their university
--    - Users can only update/delete their own files
--
-- 4. Media Table:
--    - The media table tracks all uploads and is the source of truth
--    - Storage RLS policies complement the media table policies
--
-- 5. Troubleshooting:
--    - If uploads fail with RLS error, check that the path matches the format
--    - Ensure user has a profile with university_id set
--    - Check that policies are active: SELECT * FROM pg_policies WHERE tablename = 'objects';
-- ============================================================================
