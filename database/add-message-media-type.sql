-- ============================================================================
-- Add message_media to media_type Check Constraint
-- ============================================================================
-- This adds 'message_media' to the allowed media types for chat images
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, check what the current constraint allows
DO $$
DECLARE
  constraint_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conname = 'media_media_type_check'
  LIMIT 1;
  
  RAISE NOTICE 'Current constraint: %', constraint_def;
END $$;

-- Drop the existing constraint
ALTER TABLE public.media DROP CONSTRAINT IF EXISTS media_media_type_check;

-- Recreate the constraint with message_media included
ALTER TABLE public.media ADD CONSTRAINT media_media_type_check 
CHECK (media_type = ANY (ARRAY[
  'profile_avatar'::text,
  'profile_banner'::text,
  'profile_photo'::text,
  'post'::text,
  'story'::text,
  'event_cover'::text,
  'event_gallery'::text,
  'org_logo'::text,
  'org_cover'::text,
  'message'::text,
  'message_media'::text  -- Added for chat images
]));

-- Verify the constraint was created
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'media_media_type_check';

SELECT 'message_media type added to media table! ✅' AS status;

