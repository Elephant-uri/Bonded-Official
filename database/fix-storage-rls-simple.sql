-- ============================================================================
-- SIMPLIFIED STORAGE RLS POLICIES FOR BONDED-MEDIA BUCKET
-- ============================================================================
-- This is a simpler, more permissive version for testing
-- Run this in your Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: ENSURE BUCKET EXISTS AND IS CONFIGURED
-- ============================================================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bonded-media',
  'bonded-media',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];

-- ============================================================================
-- PART 2: DROP ALL EXISTING POLICIES
-- ============================================================================

-- Get all policy names for storage.objects and drop them
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'objects'
    AND schemaname = 'storage'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON storage.objects';
  END LOOP;
END $$;

-- ============================================================================
-- PART 3: CREATE SIMPLE, PERMISSIVE POLICIES FOR TESTING
-- ============================================================================

-- POLICY 1: Authenticated users can upload to bonded-media bucket
CREATE POLICY "authenticated_insert_bonded_media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bonded-media'
);

-- POLICY 2: Authenticated users can read from bonded-media bucket
CREATE POLICY "authenticated_select_bonded_media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'bonded-media'
);

-- POLICY 3: Authenticated users can update their files
CREATE POLICY "authenticated_update_bonded_media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bonded-media'
)
WITH CHECK (
  bucket_id = 'bonded-media'
);

-- POLICY 4: Authenticated users can delete files
CREATE POLICY "authenticated_delete_bonded_media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'bonded-media'
);

-- ============================================================================
-- PART 4: MEDIA TABLE POLICIES (Simplified)
-- ============================================================================

-- Drop existing policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'media'
    AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.media';
  END LOOP;
END $$;

-- Simple policy: authenticated users can do everything
CREATE POLICY "authenticated_all_media"
ON public.media
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PART 5: GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON public.media TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- View all storage policies
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'objects' AND schemaname = 'storage';

-- View media table policies
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'media' AND schemaname = 'public';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- This is a PERMISSIVE policy set for testing/development.
-- Once uploads are working, you should tighten these policies to restrict:
-- 1. Users can only upload to their own folder
-- 2. Users can only read files from their university
-- 3. Users can only delete their own files
--
-- The production-ready policies with proper restrictions are in:
-- fix-storage-rls-policies.sql
-- ============================================================================
