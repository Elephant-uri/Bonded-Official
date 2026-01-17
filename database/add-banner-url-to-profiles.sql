-- ============================================================================
-- Add banner_url Column to Profiles
-- ============================================================================
-- This script adds the banner_url column to the profiles table to support
-- profile banner images.
--
-- Run this in Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS check).
-- ============================================================================

-- Add banner_url column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'banner_url'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN banner_url TEXT;

    COMMENT ON COLUMN public.profiles.banner_url IS 'URL to user profile banner image stored in bonded-media bucket';
  END IF;
END $$;
