-- ============================================================================
-- Add Metadata Column to Messages Table
-- ============================================================================
-- This adds a metadata JSONB column to store image URLs, message types, etc.
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
  ) THEN
    -- Add metadata column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'messages' 
      AND column_name = 'metadata'
    ) THEN
      ALTER TABLE public.messages 
      ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
      
      RAISE NOTICE '✅ Added metadata column to messages table';
    ELSE
      RAISE NOTICE 'ℹ️ metadata column already exists';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ messages table does not exist';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'messages'
AND column_name = 'metadata';

SELECT 'Message metadata column setup complete! ✅' AS status;

