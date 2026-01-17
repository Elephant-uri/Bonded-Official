-- ============================================================================
-- FIX ALL RLS RECURSION ISSUES
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FIX conversation_participants RLS (infinite recursion)
-- ============================================================================

-- Drop existing policies (including any we might have created before)
DROP POLICY IF EXISTS "Users can view their own participations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert participations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can delete their participations" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_select" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete" ON conversation_participants;
DROP POLICY IF EXISTS "cp_select_own" ON conversation_participants;
DROP POLICY IF EXISTS "cp_select_same_conversation" ON conversation_participants;
DROP POLICY IF EXISTS "cp_select" ON conversation_participants;
DROP POLICY IF EXISTS "cp_insert" ON conversation_participants;
DROP POLICY IF EXISTS "cp_update_own" ON conversation_participants;
DROP POLICY IF EXISTS "cp_delete_own" ON conversation_participants;

-- SIMPLEST APPROACH: Users can only see their own participant rows
CREATE POLICY "cp_select"
ON conversation_participants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create a function to get conversation participants (bypasses RLS)
-- This allows users to see who else is in their conversations
CREATE OR REPLACE FUNCTION get_conversation_participants(conv_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  username text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    cp.user_id,
    p.full_name,
    p.username,
    p.avatar_url
  FROM conversation_participants cp
  JOIN profiles p ON p.id = cp.user_id
  WHERE cp.conversation_id = conv_id
  AND cp.user_id != auth.uid();
$$;

CREATE POLICY "cp_insert"
ON conversation_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM conversations
  WHERE id = conversation_id
  AND created_by = auth.uid()
));

CREATE POLICY "cp_update_own"
ON conversation_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "cp_delete_own"
ON conversation_participants FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 2. FIX friend_requests RLS
-- ============================================================================

-- Drop existing policies (including any we might have created before)
DROP POLICY IF EXISTS "Users can view their friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update received requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can delete their sent requests" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_select" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_insert" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_update" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_delete" ON friend_requests;
DROP POLICY IF EXISTS "fr_select" ON friend_requests;
DROP POLICY IF EXISTS "fr_insert" ON friend_requests;
DROP POLICY IF EXISTS "fr_update" ON friend_requests;
DROP POLICY IF EXISTS "fr_delete" ON friend_requests;

-- Create simple policies
CREATE POLICY "fr_select"
ON friend_requests FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "fr_insert"
ON friend_requests FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "fr_update"
ON friend_requests FOR UPDATE
TO authenticated
USING (receiver_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "fr_delete"
ON friend_requests FOR DELETE
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ============================================================================
-- 3. FIX posts RLS (for delete)
-- ============================================================================

-- Drop existing policies (including any we might have created before)
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;
DROP POLICY IF EXISTS "posts_delete_own" ON posts;
DROP POLICY IF EXISTS "posts_update_own" ON posts;

-- Create delete policy
CREATE POLICY "posts_delete_own"
ON posts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Also ensure update policy exists for soft delete
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "posts_update" ON posts;

CREATE POLICY "posts_update_own"
ON posts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 4. FIX friendships RLS
-- ============================================================================

-- Drop existing policies (including any we might have created before)
DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;
DROP POLICY IF EXISTS "friendships_select" ON friendships;
DROP POLICY IF EXISTS "friendships_insert" ON friendships;
DROP POLICY IF EXISTS "friendships_delete" ON friendships;
DROP POLICY IF EXISTS "fs_select" ON friendships;
DROP POLICY IF EXISTS "fs_insert" ON friendships;
DROP POLICY IF EXISTS "fs_delete" ON friendships;

-- Create simple policies
CREATE POLICY "fs_select"
ON friendships FOR SELECT
TO authenticated
USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "fs_insert"
ON friendships FOR INSERT
TO authenticated
WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "fs_delete"
ON friendships FOR DELETE
TO authenticated
USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- ============================================================================
-- DONE! Your RLS policies should now work without recursion errors.
-- ============================================================================
