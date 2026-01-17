-- ============================================================================
-- Fix Post Delete RLS Policies
-- ============================================================================
-- This ensures users can delete (soft delete) their own posts
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop existing update/delete policies on posts
DROP POLICY IF EXISTS "posts_update_own" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "posts_update" ON posts;
DROP POLICY IF EXISTS "posts_delete_own" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;

-- Ensure RLS is enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create UPDATE policy for soft delete (setting deleted_at)
-- Users can update their own posts
CREATE POLICY "posts_update_own"
ON posts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create DELETE policy for hard delete (fallback)
-- Users can delete their own posts
CREATE POLICY "posts_delete_own"
ON posts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Verify policies were created
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'posts'
AND policyname IN ('posts_update_own', 'posts_delete_own')
ORDER BY policyname;

SELECT 'Post delete RLS policies fixed! ✅' AS status;

